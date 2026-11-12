# TeamFlow — Project Management & Team Collaboration Platform

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A modern, full-stack, enterprise-grade project management platform built for agile teams.**  
*Multi-tenant workspaces, real-time drag-and-drop Kanban boards, granular 3-tier RBAC, milestone calendars, personal task queues, live WebSocket event distribution, and automated transactional emails.*

[Live Demo](#production-deployment) • [Architecture](#system-architecture) • [Getting Started](#local-development-quickstart) • [Deployment Guide](#production-deployment) • [Demo Accounts](#pre-seeded-demo-accounts)

</div>

---

## Highlights & Features

- 🏢 **Multi-Tenant Workspaces**: Strict data isolation with UUID tenant segregation. Users can create, manage, or join multiple workspaces with independent memberships.
- 📋 **Real-Time Kanban Boards**: Smooth drag-and-drop task movement powered by `@dnd-kit`. Instant board updates across all connected teammates via WebSockets (`Socket.IO`).
- 🛡️ **Granular 3-Tier Access Control (RBAC)**:
  - **Platform Tier**: `PLATFORM_ADMIN`, `USER`
  - **Workspace Tier**: `OWNER`, `ADMIN`, `MEMBER`, `GUEST`
  - **Project Tier**: `MANAGER`, `MEMBER`, `VIEWER` (Safe read-only stakeholder access)
- 🔐 **Bank-Grade Authentication**:
  - Secure Argon2id password hashing
  - Dual JWT access (short-lived) + rotating refresh token mechanism
  - Automatic compromised token family revocation on reuse detection
  - HTTP-only, SameSite-strict cross-domain session cookies
- 📅 **Milestone Calendar**: High-level timeline aggregating deliverable deadlines across all projects.
- ⚡ **Personal Task Queue ("My Tasks")**: Unified personal dashboard showing all assigned tasks, priority badges, and approaching due dates.
- 💬 **Collaboration & Discussions**: Threaded task comments, real-time activity audit trails, and in-app notifications with unread counters.
- ✉️ **Transactional Email System**: Automatic email dispatch via SMTP for workspace invitations, project assignments, and password recovery.
- 📊 **Sprint & Velocity Analytics**: Live completion ratios, overdue counters, and workload distribution metrics.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Tier (Vercel)"]
        UI["React 18 + Vite SPA\nTailwind CSS • Zustand • TanStack Query"]
    end

    subgraph Server["Application Tier (Render)"]
        API["Node.js + Express API\nREST Routes • Zod Validation • Helmet"]
        Auth["Auth Engine\nArgon2id • JWT Rotation • RBAC Guards"]
        WS["Socket.IO Server\nRoom Subscriptions • Real-time Broadcast"]
    end

    subgraph Data["Persistence Tier (Neon Cloud)"]
        DB[("Neon Serverless PostgreSQL\nPrisma ORM • Connection Pooling")]
    end

    subgraph External["External Services"]
        SMTP["SMTP Mail Gateway\n(Gmail / Mailtrap)"]
    end

    UI -->|"HTTPS REST Calls (withCredentials)"| API
    UI <-->|"WSS Real-time Events"| WS
    API --> Auth
    API -->|"Prisma Client (Pooled)"| DB
    API -->|"Transactional Emails"| SMTP
    WS -->|"Broadcast Task & Board State"| UI
```

---

## Tech Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Router v7, `@dnd-kit` (Kanban), Lucide Icons, Sonner |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Socket.IO, Argon2, JSON Web Tokens (JWT), Pino Logger, Zod, Nodemailer |
| **Database** | PostgreSQL 16+ on [Neon](https://neon.tech) (Serverless with PgBouncer connection pooling) |
| **Testing** | Vitest, React Testing Library, Supertest, Newman / Postman |
| **Hosting** | Vercel (Frontend SPA), Render (Backend Web Service), Neon (Cloud PostgreSQL) |

---

## Repository Structure

```text
project-management-platform/
├── backend/                      # Express REST API & WebSocket server
│   ├── prisma/                   # Prisma schema, migrations & seed scripts
│   │   ├── schema.prisma         # Multi-tenant schema definition
│   │   └── seed.ts               # Demo accounts & seed data generator
│   ├── src/
│   │   ├── config/               # App configuration (CORS, DB, Env, JWT)
│   │   ├── middlewares/          # Auth guards, RBAC, error handlers
│   │   ├── modules/              # Feature modules (auth, workspaces, projects, tasks, comments, etc.)
│   │   ├── services/             # Email, socket, and storage services
│   │   └── server.ts             # Express & Socket.IO server bootstrap
│   ├── tests/                    # Integration & security test suites
│   └── package.json
├── frontend/                     # Vite + React single-page application
│   ├── src/
│   │   ├── components/           # Reusable UI primitives (Button, Modal, Input)
│   │   ├── features/             # Feature slices (boards, tasks, workspaces, landing, team)
│   │   ├── layouts/              # Main dashboard & public layouts
│   │   ├── services/             # Axios API client & Socket.IO connection
│   │   └── stores/               # Zustand state stores (auth, workspace, theme)
│   ├── vercel.json               # SPA client-side routing rewrite rules
│   └── package.json
├── render.yaml                   # Infrastructure-as-code for Render deployment
└── README.md
```

---

## Local Development Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) LTS (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Local instance or free [Neon](https://neon.tech) account)
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/project-management-platform.git
cd project-management-platform
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy sample environment configuration
cp .env.example .env
```

Configure your `.env` file with your database connection and secrets:
```ini
NODE_ENV=development
PORT=8000
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL or Neon)
DATABASE_URL="postgresql://user:password@localhost:5432/teamflow_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/teamflow_db?schema=public"

# Authentication Secrets (Generate secure random 32+ character strings)
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMTP Email Configuration (Optional for local testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="TeamFlow <noreply@teamflow.local>"
```

Generate Prisma client, push database schema, and seed initial demo data:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start backend development server
npm run dev
```
The backend API is now running at `http://localhost:8000`.  
- **Health Check**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/api/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install

# Copy frontend environment file
cp .env.example .env

# Start frontend development server
npm run dev
```
The React frontend is now running at `http://localhost:5173`.

---

## Pre-Seeded Demo Accounts

When you run `npm run prisma:seed`, the following accounts are automatically created:

| Role / Permissions | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Platform Admin & Workspace Owner** | Yerosan Girma | `yerosan@teamflow.local` | `Password123!` |
| **Workspace Member & Developer** | Yoni Tola | `yoni@teamflow.local` | `Password123!` |
| **Workspace Member & Developer** | Gemachu | `gemachu@teamflow.local` | `Password123!` |
| **Guest / Stakeholder (Viewer)** | Tesfaye | `tesfaye@teamflow.local` | `Password123!` |

> 💡 **Default Workspace**: `Acme Corp Engineering` with active Kanban boards and sample sprint tasks.

---

## Production Deployment

TeamFlow is architected for zero-cost, high-reliability deployment using **Neon + Render + Vercel**:

```mermaid
flowchart LR
    Vercel["Frontend on Vercel\nhttps://your-app.vercel.app"] -->|"REST API & WebSockets\n(withCredentials: true)"| Render["Backend on Render\nhttps://your-api.onrender.com"]
    Render -->|"Pooled Database Connection"| Neon[("Neon Cloud PostgreSQL\nServerless")]
```

### Step 1: Database Setup on Neon
1. Create a project at [Neon](https://neon.tech).
2. From the Neon Dashboard, copy both connection strings:
   - **`DATABASE_URL` (Pooled)**: Check the *Pooled connection* toggle (`*-pooler.*.aws.neon.tech`).
   - **`DIRECT_URL` (Direct)**: Uncheck the *Pooled connection* toggle (used by Prisma for schema migrations).
3. Push schema and seed from your local machine:
   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   npx tsx backend/prisma/seed.ts
   ```

### Step 2: Deploy Backend to Render
1. Sign in to [Render](https://render.com) and click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Set the service properties:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/server.js`
4. Add the required **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `<Your Neon Pooled Connection String>`
   - `DIRECT_URL`: `<Your Neon Direct Connection String>`
   - `JWT_ACCESS_SECRET`: `<Random 32+ character secret>`
   - `JWT_REFRESH_SECRET`: `<Random 32+ character secret>`
   - `ACCESS_TOKEN_EXPIRES_IN`: `15m`
   - `REFRESH_TOKEN_EXPIRES_IN`: `7d`
   - `APP_URL`: `https://<your-render-service>.onrender.com`
   - `FRONTEND_URL`: `https://<your-vercel-app>.vercel.app`
   - Set `EMAIL_PROVIDER` to `mailtrap`, `resend`, or `smtp`, then configure that provider's credentials. `console` is for local development only and does not deliver email.
   - For Mailtrap, set `MAILTRAP_TOKEN`; for Resend, set `RESEND_API_KEY`; for SMTP, set `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, and `SMTP_PORT`.
   - Set `EMAIL_FROM` to a sender address verified with the selected provider. Gmail SMTP is not available from some cloud platforms, including Render.
5. Click **Create Web Service**. Verify health status at `https://<your-render-service>.onrender.com/health`.

### Step 3: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com/api/v1`
   - `VITE_SOCKET_URL`: `https://<your-render-service>.onrender.com`
5. Click **Deploy**. Vercel will build the SPA in ~25 seconds.
   *(Client-side routing on `/dashboard`, `/projects`, etc. is seamlessly handled by `frontend/vercel.json`).*

### Step 4: Final CORS & Cookie Link
In Render &rarr; Environment &rarr; update `FRONTEND_URL` to your production Vercel domain (`https://<your-vercel-app>.vercel.app`). Render will automatically restart with full cross-domain cookie and CORS authorization.

---

## Testing & Quality Assurance

The codebase includes automated tests across every layer of the stack:

```bash
# Run all backend Vitest integration & security suites
npm --prefix backend test

# Run frontend Vitest component & user-flow tests
npm --prefix frontend test

# Run full TypeScript compilation verification
npm --prefix backend run build
npm --prefix frontend run build
```

---

## Security & Best Practices

- **Zero Secret Exposure**: `.env` and sensitive configurations are strictly ignored in `.gitignore`.
- **SQL Injection Prevention**: 100% of database queries execute through Prisma parameterization.
- **Cross-Site Scripting (XSS)**: Inputs sanitized through Zod schema validation; React JSX auto-escaping.
- **CSRF & Cookie Protection**: Cross-site authentication cookies use `SameSite: None` and `Secure: true` in production with strict origin whitelisting.
- **Rate Limiting**: Express rate limiters protect public authentication endpoints against brute-force attacks.
- **Access Control Testing**: 26 integration tests verify multi-tenant isolation, IDOR prevention, and RBAC guard enforcement.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE) &copy; 2026 TeamFlow Contributors.
