# TeamFlow — Project Management & Team Collaboration Platform

![TeamFlow](https://img.shields.io/badge/TeamFlow-Production--Grade%20Backend-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-LTS-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-darkblue?style=for-the-badge&logo=prisma)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black?style=for-the-badge&logo=socket.io)

TeamFlow is a full-stack, enterprise-oriented project management and team collaboration platform built for scale. Designed to support multi-tenant workspaces, customizable Kanban boards, granular role-based permissions, threaded task discussions, real-time event distribution, and project analytics.

---

## Architecture Overview

```
Client Request
      │
      ▼
Express Route ──► Middleware (Auth, Validate, Rate Limit, CORS, Helmet)
                        │
                        ▼
                   Controller (HTTP requests/responses)
                        │
                        ▼
                    Service (Business logic & real-time dispatch)
                        │
                        ▼
                   Repository (Prisma ORM queries)
                        │
                        ▼
               PostgreSQL Database (teamflow_db)
```

### Core Features

- **Multi-Tenant Workspace Isolation**: Data strictly separated by workspace. Users can own multiple workspaces and belong to others with distinct roles.
- **Granular RBAC**: Three decoupled authorization tiers:
  - Platform Roles (`PLATFORM_ADMIN`, `USER`)
  - Workspace Roles (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`)
  - Project Roles (`MANAGER`, `MEMBER`, `VIEWER`)
- **Robust Authentication**:
  - Argon2id password hashing
  - Dual JWT access + refresh token rotation
  - Token reuse detection (compromised lineage invalidation)
  - Active session device tracking and individual session revocation
  - Email verification & password reset flows
- **Kanban Board & Column Management**:
  - Default project generation creates Main Board and 4 columns (`To Do`, `In Progress`, `In Review`, `Completed`) in a single transaction.
  - Drag-and-drop task movement with automatic `completedAt` timestamp calculation.
  - Safe column deletion requiring task migration target.
  - Cross-project task isolation guardrails.
- **Task Management**:
  - Priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due dates, start dates.
  - Multi-user assignees with strict project membership enforcement.
  - Workspace labels tagging and search filtering.
- **Collaboration & Monitoring**:
  - Threaded comment replies with author and moderation permissions.
  - Real-time Socket.IO events (`task:created`, `task:moved`, `comment:created`, etc.) with room authorization.
  - Activity audit logging.
  - In-app notification persistence with unread counters.
  - Background scheduler for upcoming (24h) and overdue task deadline alerts.
- **Dashboard & Project Analytics**:
  - Task completion rates, overdue counters, priority distribution, and member workload metrics.
- **Interactive Documentation**:
  - Complete OpenAPI 3.0 specification available at `/api/docs`.

---

## Quick Start

### 1. Installation
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Database Migration & Seeding
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit:
- **API Docs**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`

### 5. Run Integration Tests
```bash
npm test
```

---

## Pre-seeded Test Accounts

| Role | Email | Password |
|---|---|---|
| Platform Admin | `admin@teamflow.local` | `Password123!` |
| Workspace Owner / PM | `alice@teamflow.local` | `Password123!` |
| Developer / Member | `bob@teamflow.local` | `Password123!` |
| Client / Guest | `charlie@teamflow.local` | `Password123!` |

---

## Documentation

- [API Endpoints & Sockets Guide](backend/docs/API_DOCUMENTATION.md)
- [Database Schema & ERD](backend/docs/DATABASE_DESIGN.md)
- [Authentication & Security](backend/docs/AUTHENTICATION.md)
- [Deployment & Docker Guide](backend/docs/DEPLOYMENT.md)
