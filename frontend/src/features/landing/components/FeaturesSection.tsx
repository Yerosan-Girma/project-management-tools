import React from 'react';
import { Link } from 'react-router-dom';
import {
  Kanban,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="scroll-mt-20 border-y border-slate-200/60 bg-slate-50/50 py-24 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Engineered for focused delivery</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Everything your team needs, without the dashboard bloat
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Built as one cohesive system — boards, tasks, calendar, permissions, and analytics that stay synchronized in real time.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* BENTO TILE 1: Collaborative Kanban (Span 2 cols) */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all hover:shadow-xl md:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="max-w-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
                  <Kanban className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Real-time collaborative Kanban
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Custom columns, drag-and-drop cards, priority tags, and issue keys. When a teammate moves a card, WebSockets update every screen without a refresh.
                </p>
              </div>

              {/* Live WebSocket Indicator Badge */}
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>Live Socket.IO Sync</span>
              </div>
            </div>

            {/* Visual Mini Board Showcase */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/50">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Column 1: In Progress */}
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>In Progress</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-primary-200/70 bg-primary-50/30 p-2.5 shadow-2xs dark:border-primary-900/60 dark:bg-primary-950/20">
                      <span className="text-[10px] font-bold text-primary-700 dark:text-primary-300">ENG-108</span>
                      <p className="mt-1 text-xs font-medium text-slate-900 dark:text-white">Implement OAuth 2.0 PKCE flow</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">URGENT</span>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">YG</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Code Review */}
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Review</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">1</span>
                  </div>
                  <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">ENG-94</span>
                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-white">Multi-tenant schema migration</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">HIGH</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">YT</div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Done */}
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Done</span>
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">4</span>
                  </div>
                  <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/20 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">ENG-82</span>
                    <p className="mt-1 text-xs font-medium text-slate-900 line-through opacity-70 dark:text-white">Live email invitation dispatch</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">COMPLETED</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO TILE 2: Strict Isolation (Span 1 col) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Strict workspace isolation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Multi-tenant scoping ensures client deliverables, sensitive engineering code, and discussions never cross workspace boundaries.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/50">
              <div className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">Engineering Workspace</span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Isolated</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">Client Portal A</span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Isolated</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-2xs dark:bg-slate-900">
                <span className="font-semibold text-slate-900 dark:text-white">Operations &amp; HR</span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Isolated</span>
              </div>
            </div>
          </div>

          {/* BENTO TILE 3: Enterprise RBAC (Span 1 col) */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Role-based access control
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Enforced by API middleware at both the workspace and project layers, matching real team permissions.
              </p>
            </div>

            <div className="mt-6 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Platform Admin</span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">System Overseer</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Workspace Owner</span>
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">Full Control</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Project Admin</span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Manage &amp; Invite</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Member</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Sprint Delivery</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Viewer</span>
                <span className="text-[11px] font-bold text-slate-500">Read-Only</span>
              </div>
            </div>
          </div>

          {/* BENTO TILE 4: Analytics & Calendar (Span 2 cols) */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all hover:shadow-xl md:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="max-w-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Sprint velocity &amp; deadline intelligence
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Stay ahead of deliverable milestones. Real-time velocity metrics, task status breakdowns, and cross-project calendar views keep the entire team aligned.
                </p>
              </div>

              <Link to="/features#analytics">
                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore metrics
                </Button>
              </Link>
            </div>

            {/* Visual Mini Metrics Bar */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800/80 dark:bg-slate-950/50">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3 text-center shadow-2xs dark:bg-slate-900">
                  <span className="block text-2xl font-black text-primary-600 dark:text-primary-400">98.4%</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">On-time Completion</span>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-2xs dark:bg-slate-900">
                  <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">54 pts</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Sprint 14 Velocity</span>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-2xs dark:bg-slate-900">
                  <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">&lt;15ms</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Socket Latency</span>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-2xs dark:bg-slate-900">
                  <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">0</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Blocked Milestones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
