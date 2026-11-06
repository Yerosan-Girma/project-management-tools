# TeamFlow — Frontend Application

Modern, real-time project management and team collaboration web application built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, and Socket.IO.

---

## 🚀 Key Features

- **Public Marketing Experience**: High-converting responsive landing page featuring interactive Kanban & analytics preview, capability breakdown, interactive FAQs, and seamless sign-up.
- **Enterprise Authentication & Route Guards**: Full registration, login, token refresh queue with auto-retry, password recovery, email verification, and profile management with avatar customization.
- **Multi-Tenant Workspaces**: Isolated tenant environments, workspace switcher dropdown, team invitations with role governance (Owner, Admin, Member, Guest), member removal, and ownership transfer.
- **Interactive Kanban Boards (`@dnd-kit`)**: Drag-and-drop task movement across customizable stages (To Do, In Progress, In Review, Done), optimistic client updates with automated API error rollback, WIP capacity limits, and column color badges.
- **Comprehensive Task Lifecycle**: Priority flags (Urgent, High, Medium, Low), multi-assignee assignment, due date trackers with overdue alerts, label management, and task detail drawer.
- **Threaded Task Discussions**: Nested replies, author metadata, relative timestamps via `date-fns`, and inline editing/deletion.
- **Real-Time Collaboration (Socket.IO)**: Multi-room subscription (`workspace:<id>`, `project:<id>`, `user:<id>`) with automated TanStack Query cache invalidations on live task moves, comments, and project changes.
- **Live Notifications Center**: Instant in-app toasts on incoming socket broadcasts, unread notification counter, mark as read, and direct resource navigation.
- **Analytics & Deadline Calendar**: Recharts KPI charts, task velocity gauges, overdue warnings, and interactive full-month task calendar.
- **Dark Mode & Responsive SaaS UX**: Persistent theme switching, collapsible desktop/mobile navigation drawers, and WCAG-accessible components.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 18, TypeScript 5, Vite 6 |
| **Styling & Design System** | Tailwind CSS 3, Lucide React, PostCSS, Autoprefixer |
| **State Management** | Zustand 5 (Auth, Workspace, UI) |
| **Server State & Caching** | TanStack Query 5 (React Query) |
| **Routing** | React Router DOM 7 (Data Router) |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Real-Time WebSockets** | Socket.IO Client 4 |
| **Forms & Validation** | React Hook Form 7, Zod 3, `@hookform/resolvers` |
| **Charts & Metrics** | Recharts 2 |
| **Testing** | Vitest 3, React Testing Library, jsdom |
| **Containerization** | Docker (Multi-stage build), Nginx Alpine |

---

## 📂 Project Architecture

```
frontend/
├── public/
│   └── logo/teamflow.svg
├── src/
│   ├── app/
│   │   ├── App.tsx             # Root Application Provider
│   │   ├── providers.tsx       # QueryClient, Sonner Toaster, Theme provider
│   │   ├── query-client.ts     # TanStack Query configuration
│   │   └── router.tsx          # Centralized route tree with ProtectedRoute & GuestRoute
│   ├── components/
│   │   ├── layout/             # AppLayout, AuthLayout, ProtectedRoute, GuestRoute
│   │   └── ui/                 # Button, Input, Textarea, Select, Card, Badge, Avatar, Modal, Tabs, EmptyState
│   ├── features/
│   │   ├── analytics/          # Analytics services and metrics
│   │   ├── auth/               # Login, Register, Forgot Password, Reset Password, Verify Email, Profile
│   │   ├── boards/             # KanbanBoard, KanbanColumn, TaskCard, Board services
│   │   ├── calendar/           # Monthly deadline calendar
│   │   ├── comments/           # Threaded TaskComments component & services
│   │   ├── dashboard/          # Platform overview KPIs, velocity charts, quick access
│   │   ├── invitations/        # Accept/Decline workspace invitations
│   │   ├── landing/            # Public marketing landing page & components
│   │   ├── notifications/      # Notifications center & real-time alerts
│   │   ├── projects/           # Projects list, details, project settings & members
│   │   ├── tasks/              # CreateTaskModal, TaskDetailModal, MyTasksPage, task services
│   │   └── workspaces/         # WorkspacesPage, WorkspaceDetailPage, modals & services
│   ├── services/
│   │   ├── api.ts              # Axios instance with Bearer interceptors & auto token refresh
│   │   └── socket.ts           # Socket.IO client singleton with room management
│   ├── stores/                 # Zustand stores (auth-store, workspace-store, ui-store)
│   ├── test/                   # Vitest suites (UI primitives, Auth store, Validation schemas)
│   ├── types/                  # Strict TypeScript data models matching backend contracts
│   └── styles/index.css        # Tailwind directives and custom scrollbars
├── nginx.conf                  # Production SPA Nginx configuration with gzip & security headers
├── Dockerfile                  # Multi-stage production container
└── package.json
```

---

## ⚙️ Environment Variables

Create `.env` in the `frontend/` directory (see `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=TeamFlow
```

---

## 🏃 Local Development Commands

```bash
# Install dependencies
npm install

# Start Vite development server (port 3000)
npm run dev

# Run unit and integration tests
npm run test

# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🐳 Docker Deployment

To build and run the frontend via Docker:

```bash
# Build Docker image
docker build -t teamflow-frontend:latest ./frontend

# Run production container on port 80
docker run -d -p 80:80 --name teamflow-web teamflow-frontend:latest
```
