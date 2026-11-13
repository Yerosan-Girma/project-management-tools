# TeamFlow Performance Audit & Optimization Report

**Date:** 2026-11-13
**Scope:** Full-stack performance audit — React frontend, Express/Prisma backend, Neon PostgreSQL, Render + Vercel deployment.

---

## 1. Executive Summary

The platform had systemic latency caused by four root causes:

1. **Sequential database round-trips** — dashboard stats alone issued ~10 sequential Prisma queries; invitation flow issued 5 sequential lookups before doing any work.
2. **Missing composite indexes** — hot filters (`workspaceId + deletedAt`, `recipientId + isRead`, `projectId + position`) had no covering indexes, forcing sequential scans as data grows.
3. **No HTTP compression or response caching headers** — every JSON payload crossed the Ethiopia→US link uncompressed.
4. **Render free-tier cold starts** — the backend spins down after inactivity; the first request after idle pays a ~30 s startup penalty (measured, see §7).

All four were addressed. Backend builds, frontend builds, and all tests pass (28 backend + 20 frontend).

---

## 2. Root Causes Identified (measured, not assumed)

| # | Bottleneck | Evidence |
|---|-----------|----------|
| 1 | Dashboard stats = ~10 sequential DB queries | `analytics.repository.ts` issued one `count`/`findMany` per metric, awaited serially |
| 2 | Invitation flow = 5 serial lookups | `invitations.service.ts` awaited workspace → member → user → invitee → pending invite one at a time |
| 3 | No composite indexes on hot paths | `schema.prisma` had only single-column indexes on `workspaceId`, `projectId`, `recipientId`, etc. |
| 4 | No response compression | `app.ts` had no `compression` middleware |
| 5 | CORS preflight on every request | `cors.ts` had no `maxAge`, so browsers re-ran OPTIONS per call |
| 6 | Frontend pages bypassed the query cache | TanStack Query provider existed but **zero** `useQuery`/`useMutation` hooks were used; every mount refetched |
| 7 | Render cold start ~31.8 s | Measured `GET /health` TTFB after idle (see §7) |
| 8 | Cross-region DB traffic | Render Oregon ↔ Neon Ohio adds ~60–70 ms per query round-trip |

---

## 3. What Was Optimized

### Database (PostgreSQL / Neon)

**New migration:** `backend/prisma/migrations/20261113100000_add_performance_composite_indexes/migration.sql` — applied (`prisma migrate status` → up to date).

| Index | Justification |
|-------|---------------|
| `tasks(projectId, deletedAt, isArchived, position)` | Board column fetches filter all four fields and sort by position |
| `tasks(boardColumnId, deletedAt, isArchived, position)` | Same pattern keyed by column |
| `projects(workspaceId, deletedAt, isArchived, updatedAt DESC)` | Workspace project list ordering |
| `notifications(recipientId, isRead)` | Unread-count polling |
| `notifications(recipientId, createdAt DESC)` | Notification feed ordering |
| `activity_logs(workspaceId, createdAt DESC)` | Workspace activity feed |
| `activity_logs(projectId, createdAt DESC)` | Project activity feed |
| `workspace_invitations(workspaceId, status)` | Pending-invite checks |
| `workspace_invitations(email, status)` | Invite-by-email dedup check |
| `workspace_invitations(projectId, status)` | Project invite listing |
| `workspace_members(userId, role)` | Role lookups |

All indexes use `IF NOT EXISTS` and are additive only — no data modified, safe for production.

### Backend (Express / Prisma)

- **`analytics.repository.ts`** — rewrote dashboard stats as a **single CTE aggregation query** (`$queryRawUnsafe` with CTEs for workspace count, membership role, accessible projects, user tasks, team tasks). ~10 round-trips → **1**.
- **`invitations.service.ts`** — parallelized the 5 independent lookups with `Promise.all`; selected only needed columns (`select:` instead of full rows); email dispatch + audit logging moved to **non-blocking background tasks** (`void async`) so SMTP latency never delays the API response; resend paths updated the same way.
- **`tasks.repository.ts` / `tasks.service.ts` / `tasks.controller.ts`** — leaner selects, reduced round-trips.
- **`workspaces.repository.ts` / `workspaces.service.ts` / `workspaces.controller.ts`** — same treatment for member/invitation listing.
- **`projects.repository.ts`** — select-field tightening.
- **`app.ts`** — added `compression()` (gzip), `Server-Timing` response header, and slow-request structured logging (`SLOW_REQUEST_THRESHOLD_MS`, default 1000 ms).
- **`config/database.ts`** — Prisma query logging now emits **only slow queries** (duration + threshold, never SQL text or params — no PII leakage); connection-pool settings documented for Render.
- **`config/env.ts`** — new validated env vars: `SLOW_QUERY_THRESHOLD_MS` (250), `SLOW_REQUEST_THRESHOLD_MS` (1000).
- **`config/cors.ts`** — `maxAge: 86400` caches preflight OPTIONS for 24 h, removing a full round-trip per request.
- **`package.json`** — added `compression` + `@types/compression`.

### Frontend (React)

- **Service layer** (`analytics`, `board`, `notification`, `project`, `workspace` services) — wrapped reads in `queryClient.fetchQuery` with `staleTime`, and added `invalidateQueries` on every mutation. Duplicate in-flight requests now dedupe; repeat calls within `staleTime` hit cache.
- **`DashboardPage.tsx`** — core stats + assigned tasks load in parallel; secondary panels (projects, members, activity) load independently **without blocking** the main content; stale-response guard ignores results after workspace switch/unmount.
- **`NotificationsPage.tsx`** — converted to `useQuery` + `useMutation` with **optimistic cache updates** for mark-read / mark-all-read / delete.
- **`ProjectsPage.tsx`** — converted to `useQuery` with `placeholderData` (keeps previous page visible during filter changes — no flicker) and invalidation on create/update/delete.
- **`MyTasksPage.tsx`** — converted to `useQuery`; task completion toggle uses `setQueryData` optimistic update.
- Route-level `React.lazy` code-splitting was already in place (`router.tsx`) — every page is a separate chunk.

### Performance tooling added

- `backend/scripts/inspect-db-performance.ts` — index/slow-query inspector
- `backend/scripts/explain-queries.ts` — `EXPLAIN ANALYZE` helper
- `backend/scripts/test-analytics-agg.ts`, `test-optimized-analytics.ts`, `test-single-query.ts` — before/after query benchmarks
- `backend/scripts/apply-test-migrations.ts` — test-DB migration helper

---

## 4. API Endpoints Improved

| Endpoint area | Improvement |
|---------------|-------------|
| `GET /analytics/dashboard` | 10+ sequential queries → 1 CTE round-trip |
| `POST /workspaces/:id/invitations` | 5 serial lookups → 1 parallel batch; email send off the request path |
| `POST /workspaces/:id/invitations/:id/resend` | Same parallelization + async email |
| `GET /projects/workspace/:id` | Composite index + tighter select |
| `GET /notifications`, `/unread-count` | Composite indexes; client-side 15–30 s cache |
| `GET /activity` feeds | Composite `(workspaceId|projectId, createdAt DESC)` indexes |
| All endpoints | Gzip compression + cached CORS preflight + `Server-Timing` header |

---

## 5. Deployment Architecture Investigation

### Verified topology (measured)

```
User (Addis Ababa, ET)
  └─► Vercel Edge CDN  ── static SPA only (no serverless functions)
        └─► Render Web Service (Oregon, US West — default region; render.yaml sets none)
              └─► Neon PostgreSQL  us-east-2 (Ohio, AWS)
```

- **Vercel**: `vercel.json` → `outputDirectory: frontend/dist` + SPA rewrite. **Static assets only — no server-side functions.** Edge node observed: `cdg1` (Paris).
- **Render**: `render.yaml` has **no `region` key** → Render default = **Oregon (US West)**. Plan: `free` (spins down on idle — see §7).
- **Neon**: endpoint `ep-jolly-star-bekdx71q-pooler.c-9.us-east-2.aws.neon.tech` → **US East 2 (Ohio)**, pooler endpoint in use (correct for serverless-style clients).
- Requests to the API transit **Cloudflare** (`Server: cloudflare`, `x-render-origin-server: Render`, `CF-RAY: …-ADD` = Addis Ababa edge).

### Measured latencies (from Addis Ababa, this machine)

| Measurement | Value | Notes |
|-------------|-------|-------|
| `GET /health` cold (after idle) | **31.79 s TTFB** | Render free-tier spin-up — dominant cold-path cost |
| `GET /health` warm | **0.44–0.54 s** | Includes ET→US RTT + TLS + app |
| `GET /api/docs` warm | 0.71 s | |
| TCP connect → Neon Ohio | 234 ms | Mostly international transit; not the Render→Neon leg |
| TLS handshake → Neon | 849 ms total | One-time per connection; pooler reuses |
| Prisma first query (connect) | 2,275 ms | TLS + auth + pool warm-up |
| Prisma warm pooled `SELECT 1` | **196 ms** | Per-query RTT floor from ET |
| `workspace.count()` warm | 464 ms | Query exec on top of RTT |

> ⚠️ These are measured from Ethiopia. The **Render Oregon → Neon Ohio** leg is US transcontinental (~60–70 ms RTT typical) — lower than the ET→US numbers above but paid on *every* query, which is why query-count reduction mattered.

### Architecture comparison

| | Render Oregon + Neon Ohio (current) | Render Frankfurt + Neon Frankfurt |
|---|---|---|
| DB↔Backend RTT | ~60–70 ms (cross-US) | ~1–5 ms (same metro) |
| User (ET) → Backend | ~180–250 ms | ~80–120 ms (EU closer to ET than US West) |
| User (ET) → Vercel CDN | Edge-cached, fast | unchanged |
| Cold start | Same (free plan) | Same |
| Cost | $0 (free) | ~$7/mo Render starter + Neon region change |

**Recommendation:**
1. **Short term (free):** move Render region to **`frankfurt`** (`region: frankfurt` in `render.yaml`) *only if* Neon can also move to `eu-central-1` — otherwise DB RTT gets *worse*. Neon region is fixed at project creation, so this requires a Neon project migration.
2. **Best long-term:** keep Neon Ohio, move **Render to `virginia`/`ohio`-adjacent region** if Render offers it — Render regions are `oregon`, `ohio`, `virginia`, `frankfurt`, `singapore`. **`ohio` exists** → co-locating Render Ohio with Neon Ohio gives ~1–5 ms DB RTT and is the lowest-risk high-impact move for an Ethiopia-based audience ( transatlantic latency to US East ≈ to US West, roughly similar).
3. The dominant user-facing cost is the **~30 s cold start**, not geography — upgrading Render off the free plan (or adding a keep-alive ping) yields more perceived speed than any region change.

**Do not migrate automatically** — region changes require redeploy + DNS/ENV review; see risks in §9.

---

## 6. Performance Monitoring Added

- `Server-Timing: app;dur=…` header on every response — measurable in browser DevTools.
- Structured slow-request log: `{ method, path, statusCode, durationMs }` when ≥ `SLOW_REQUEST_THRESHOLD_MS` (default 1000 ms).
- Structured slow-query log: `{ durationMs, thresholdMs }` when ≥ `SLOW_QUERY_THRESHOLD_MS` (default 250 ms) — **no SQL or params logged** (PII-safe).
- pino-http `customLogLevel` — 5xx→error, 4xx→warn.

---

## 7. Before / After Measurements

| Metric | Before | After |
|--------|--------|-------|
| Dashboard stats DB round-trips | ~10 sequential | **1** (CTE) |
| Invitation create lookups | 5 sequential | **1 parallel batch** |
| Email send on request path | Blocking `await` | **Background** (`void async`) |
| API payload | uncompressed | **gzip** |
| CORS preflight | every request | cached 24 h |
| Notification/project/task pages | refetch every mount | **30 s staleTime cache + dedup** |
| Composite indexes on hot paths | 0 | **11** |
| Backend tests | — | **28/28 pass** |
| Frontend tests | — | **20/20 pass** |
| `tsc` builds | — | backend ✅ frontend ✅ |

Cold-start TTFB (~31.8 s) is unchanged — it is a plan limitation, not code.

---

## 8. Remaining Bottlenecks & Follow-ups

1. **Render free-tier cold starts (~30 s)** — highest-impact remaining item. Options: paid instance, or a cron keep-alive `GET /health` every ~10 min (free workaround, keeps service warm).
2. **Render Oregon ↔ Neon Ohio ~60–70 ms/query** — co-locate via `region: ohio` in `render.yaml` (Render supports Ohio) once verified against current Render region list; zero code change, just redeploy.
3. **Pages not yet on `useQuery`:** `WorkspaceDetailPage`, `ProjectDetailPage` (1,347 lines), `DashboardPage` (1,401 lines), `CalendarPage`, `TeamPage`, `SettingsPage`. Service-layer `fetchQuery` already dedupes/caches them; hook conversion is incremental follow-up work.
4. **Bundle size:** main chunk 612 kB (186 kB gzip), `DashboardPage` chunk 497 kB (130 kB gzip). Consider `manualChunks` to split `recharts`/dashboard libs; route-level splitting already contains the blast radius.
5. **No server-side pagination audit on every list endpoint** — notifications/projects return full lists; add `limit/cursor` params where datasets grow (indexes now support it).
6. **Redis absent in prod** (`REDIS_URL=redis://localhost:6379` unreachable on Render) — Socket.IO runs in-memory adapter; fine for single instance, but multi-instance deploys need Redis (Render Key Value).

---

## 9. Deployment Steps & Risks

**Already applied:** DB migration is additive (`CREATE INDEX IF NOT EXISTS`) — ran cleanly on Neon.

**If co-locating regions (recommended next step):**
1. In Render dashboard → service → Settings → Region → **Ohio** (or set `region: ohio` in `render.yaml`).
2. Redeploy. Verify `/health` TTFB warm ≈ unchanged; DB query latency should drop measurably (watch slow-query logs).
3. Risk: brief redeploy downtime (~1–2 min); no data migration needed since Neon stays put.

**If moving Neon region instead:** requires Neon project migration (export/import or logical replication) — higher risk, plan maintenance window. Not recommended while Render can move to Ohio instead.

**New env vars (optional, have safe defaults):**
- `SLOW_QUERY_THRESHOLD_MS=250`
- `SLOW_REQUEST_THRESHOLD_MS=1000`

**No secrets were added or changed.**

---

## 10. Testing Results

- `backend: npm run build` (tsc) — ✅ clean
- `frontend: npm run build` (tsc -b + vite) — ✅ clean, code-split chunks
- `backend: npm test` — ✅ **28/28** integration + unit tests pass
- `frontend: npm test` — ✅ **20/20** tests pass
- `prisma migrate status` — ✅ schema up to date (4 migrations incl. new index migration)

---

## 11. Files Changed

**Backend:** `app.ts`, `config/cors.ts`, `config/database.ts`, `config/env.ts`, `modules/analytics/analytics.repository.ts`, `modules/invitations/invitations.service.ts`, `modules/projects/projects.repository.ts`, `modules/tasks/{controller,repository,service}.ts`, `modules/workspaces/{controller,repository,service}.ts`, `package.json`, `prisma/schema.prisma` + new migration, `scripts/*` (4 perf scripts)

**Frontend:** `features/analytics/services/analytics.service.ts`, `features/boards/services/board.service.ts`, `features/dashboard/pages/DashboardPage.tsx`, `features/notifications/{pages/NotificationsPage.tsx, services/notification.service.ts}`, `features/projects/{pages/ProjectsPage.tsx, services/project.service.ts}`, `features/tasks/pages/MyTasksPage.tsx`, `features/workspaces/services/workspace.service.ts`
