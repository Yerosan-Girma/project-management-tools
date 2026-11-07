# TeamFlow - Role-Based Access Control & Architecture Report

## Executive Summary

TeamFlow is a production-grade, multi-tenant project management platform with a sophisticated three-tier role-based access control (RBAC) system. This document details the user roles, their permissions, API testing results, and overall system architecture.

---

## 1. User Roles and Permissions

### 1.1 Platform-Level Roles (Global)

These roles determine system-wide access and are the highest level of authorization.

#### Platform Admin
- **Email**: `admin@teamflow.local`
- **Access**: Full system administration capabilities
- **Can**:
  - Manage all workspaces across the platform
  - Override workspace-level restrictions
  - Access platform-level configuration
  - View and manage all users
- **Note**: Currently has no workspaces assigned in the seed data (returns empty workspace list)

#### User (Standard Platform Member)
- **Email**: `alice@teamflow.local`, `bob@teamflow.local`, `charlie@teamflow.local`
- **Access**: Standard platform features with workspace-scoped permissions
- **Can**:
  - Create and join workspaces
  - Participate in projects based on workspace/project roles
  - Access personal dashboard and assigned tasks

---

### 1.2 Workspace-Level Roles

Each workspace has its own isolation boundary with the following roles:

#### Owner
- **User**: Alice Johnson (`alice@teamflow.local`)
- **Workspace**: Acme Corp Engineering
- **Can**:
  - Full control over workspace settings
  - Create, update, and delete projects
  - Invite and remove members
  - Change member roles (including promoting to Admin)
  - Transfer ownership to another member
  - Archive the entire workspace
  - Manage workspace labels
- **API Permissions**:
  - `POST /workspaces` - Create workspace
  - `PATCH /workspaces/:id` - Update workspace
  - `DELETE /workspaces/:id` - Archive workspace
  - `POST /workspaces/:id/transfer-ownership` - Transfer ownership
  - `POST /projects` - Create projects (requires Workspace ADMIN or OWNER)

#### Admin
- **User**: Bob Smith (`bob@teamflow.local`)
- **Workspace**: Acme Corp Engineering
- **Can**:
  - Manage workspace projects
  - Invite and remove members
  - Change member roles (except OWNER role)
  - Manage workspace labels
  - View all workspace activity
- **Cannot**:
  - Archive the workspace
  - Transfer ownership
  - Remove the owner
- **API Permissions**:
  - `PATCH /workspaces/:id` - Update workspace
  - `PATCH /workspaces/:id/members/:memberId/role` - Update member roles
  - `DELETE /workspaces/:id/members/:memberId` - Remove members
  - `POST /projects` - Create projects (requires Workspace ADMIN or OWNER)

#### Member
- **User**: Charlie Davis (`charlie@teamflow.local`)
- **Workspace**: Acme Corp Engineering
- **Can**:
  - View workspace projects and tasks
  - Create and edit tasks in projects they're a member of
  - Comment on tasks
  - Participate in assigned projects
- **Cannot**:
  - Manage workspace settings
  - Invite members
  - Create projects
  - Manage other members
- **API Permissions**:
  - `GET /workspaces/:id` - View workspace
  - `GET /workspaces/:id/members` - View members
  - Project-level permissions based on project role

#### Guest / Viewer
- **Access**: Read-only access to invited tasks and projects
- **Can**:
  - View assigned tasks
  - Comment on tasks they're invited to
  - View project boards (read-only)
- **Cannot**:
  - Create or edit tasks
  - Modify project structure
  - Invite members

---

### 1.3 Project-Level Roles

Projects inherit from workspace membership but add granular project-specific permissions.

#### Manager
- **User**: Alice Johnson
- **Project**: TeamFlow Core Engine
- **Can**:
  - Configure project boards and columns
  - Archive the project
  - Add/remove project members
  - Change project member roles
  - Create, edit, and move tasks
  - Assign tasks to project members
- **API Permissions**:
  - `PATCH /projects/:id` - Update project
  - `DELETE /projects/:id` - Archive project
  - `POST /projects/:id/members` - Add members
  - `PATCH /projects/:id/members/:userId` - Update member roles
  - `DELETE /projects/:id/members/:userId` - Remove members
  - `POST /tasks` - Create tasks
  - `PATCH /tasks/:id` - Update tasks
  - `POST /tasks/:id/move` - Move tasks
  - `POST /tasks/:id/assign` - Assign users

#### Member
- **User**: Bob Smith
- **Project**: TeamFlow Core Engine
- **Can**:
  - Create, edit, and move tasks
  - Assign tasks to project members
  - Comment on tasks
  - Add labels to tasks
  - View project analytics
- **Cannot**:
  - Archive project
  - Manage project members
  - Configure boards/columns
- **API Permissions**:
  - `GET /projects/:id` - View project
  - `POST /tasks` - Create tasks
  - `PATCH /tasks/:id` - Update tasks
  - `POST /tasks/:id/move` - Move tasks
  - `POST /tasks/:id/assign` - Assign users

#### Viewer
- **User**: Charlie Davis
- **Project**: TeamFlow Core Engine
- **Can**:
  - View project boards and tasks
  - View task details
  - Comment on tasks
- **Cannot**:
  - Create or edit tasks
  - Move tasks
  - Assign tasks
  - Manage project members
- **API Permissions**:
  - `GET /projects/:id` - View project
  - `GET /projects/:id/overview` - View overview
  - `GET /projects/:id/activity` - View activity
  - `GET /tasks/project/:id` - View tasks (read-only)

---

## 2. API Testing Results

### 2.1 Authentication Endpoints

#### ✅ Login Endpoint - WORKING
```
POST /api/v1/auth/login
Request: { "email": "admin@teamflow.local", "password": "Password123!" }
Response: Success (200)
- Returns user object with platformRole: "PLATFORM_ADMIN"
- Returns accessToken (JWT, 15min expiry)
- Returns refreshToken (HTTP-only cookie, 7 days)
```

#### ✅ Login for All Demo Accounts - WORKING
All demo accounts successfully authenticate:
- `admin@teamflow.local` → Platform Admin
- `alice@teamflow.local` → User (Workspace Owner)
- `bob@teamflow.local` → User (Workspace Admin)
- `charlie@teamflow.local` → User (Workspace Member)

#### ✅ Current User Endpoint - WORKING
```
GET /api/v1/auth/me
Requires: Bearer token
Response: Current user profile
```

### 2.2 Workspace Endpoints

#### ✅ List User Workspaces - WORKING
```
GET /api/v1/workspaces
Requires: Authentication

Results by user:
- admin@teamflow.local: [] (No workspaces assigned)
- alice@teamflow.local: 1 workspace (Acme Corp Engineering - OWNER)
- bob@teamflow.local: 2 workspaces (Acme Corp Engineering - ADMIN, support digitalequb - OWNER)
- charlie@teamflow.local: 1 workspace (Acme Corp Engineering - MEMBER)
```

#### ✅ Workspace Details - WORKING
```
GET /api/v1/workspaces/:workspaceId
Requires: Workspace role GUEST or above
Response: Workspace details with member count, project count
```

#### ✅ Workspace Members - WORKING
```
GET /api/v1/workspaces/:workspaceId/members
Requires: Workspace role GUEST or above
Response: List of workspace members with their roles
```

### 2.3 Project Endpoints

#### ⚠️ Incorrect Route Pattern (Potential Issue)
```
Attempted: GET /api/v1/workspaces/:workspaceId/projects
Result: 404 Not Found

Correct Route: GET /api/v1/projects/workspace/:workspaceId
Status: ✅ WORKING
```

**Note**: The frontend may be using an incorrect API path pattern. The correct endpoint is:
- ✅ `/api/v1/projects/workspace/:workspaceId` (Correct)
- ❌ `/api/v1/workspaces/:workspaceId/projects` (Incorrect - returns 404)

#### ✅ List Workspace Projects - WORKING
```
GET /api/v1/projects/workspace/906b84a4-d676-4b12-86c6-ccf0d230e893
Response: 1 project (TeamFlow Core Engine)
- Project members: Alice (MANAGER), Bob (MEMBER), Charlie (VIEWER)
- Task count: 3 tasks
```

#### ✅ Project Details - WORKING
```
GET /api/v1/projects/:projectId
Requires: Project role VIEWER or above
Response: Project details with members, creator, task count
```

### 2.4 Board Endpoints

#### ⚠️ Incorrect Route Pattern (Potential Issue)
```
Attempted: GET /api/v1/projects/:projectId/boards
Result: 404 Not Found

Correct Route: GET /api/v1/boards/project/:projectId
Status: ✅ WORKING
```

**Note**: The frontend may be using an incorrect API path pattern. The correct endpoint is:
- ✅ `/api/v1/boards/project/:projectId` (Correct)
- ❌ `/api/v1/projects/:projectId/boards` (Incorrect - returns 404)

#### ✅ List Project Boards - WORKING
```
GET /api/v1/boards/project/3ad22420-fedb-4ee7-a600-fc7ed32dd92a
Response: 1 board (Main Board) with 4 columns:
- To Do (1 task)
- In Progress (1 task)
- In Review (0 tasks)
- Completed (1 task)
```

### 2.5 Task Endpoints

#### ✅ List Project Tasks - WORKING
```
GET /api/v1/tasks/project/:projectId
Response: 3 tasks with full details:
1. "Project architecture setup" - Completed
2. "Implement JWT authentication & refresh rotation" - In Progress
3. "Design database schema & relations" - To Do
```

#### ✅ Task Details Include:
- Assignees (can be multiple)
- Labels (workspace-level tags)
- Column/board position
- Priority (LOW, MEDIUM, HIGH, URGENT)
- Due dates
- Comments count
- Attachments count

---

## 3. Identified Issues

### 3.1 Frontend API Route Mismatches

The frontend appears to be using RESTful nested resource patterns that don't match the backend's route structure:

| Intended Frontend Call | Backend Route | Status |
|------------------------|---------------|--------|
| `/workspaces/:id/projects` | `/projects/workspace/:id` | ❌ 404 Error |
| `/projects/:id/boards` | `/boards/project/:id` | ❌ 404 Error |

**Impact**: If the frontend uses these patterns, dashboard navigation and project views will fail with 404 errors.

**Recommendation**: Update frontend service files to use the correct backend route patterns:
- `projectService.getWorkspaceProjects(workspaceId)` → `GET /api/v1/projects/workspace/:workspaceId`
- `boardService.getProjectBoards(projectId)` → `GET /api/v1/boards/project/:projectId`

### 3.2 Port Configuration (FIXED)
- **Issue**: Frontend configured for port 5000, backend on port 8000
- **Status**: ✅ FIXED - Frontend now uses port 8000
- **Files Updated**: `frontend/.env`

---

## 4. How TeamFlow Works

### 4.1 Authentication Flow

1. **User Login**:
   - User submits email/password to `/api/v1/auth/login`
   - Backend verifies credentials using Argon2id password hashing
   - On success, backend generates:
     - JWT Access Token (15 min expiry)
     - Refresh Token (7 days, stored in HTTP-only cookie)
   - Frontend stores access token in localStorage
   - Refresh token automatically used to obtain new access tokens

2. **Token Refresh**:
   - Access token expires after 15 minutes
   - Frontend intercepts 401 errors
   - Automatically calls `/api/v1/auth/refresh` with refresh token
   - New access token issued and stored
   - If refresh fails, user redirected to login

3. **Security Features**:
   - **Token Rotation**: Refresh tokens rotate on each use
   - **Reuse Detection**: If a reused refresh token is detected, entire token family is revoked
   - **Session Tracking**: Each login creates a session with IP and user agent
   - **Session Revocation**: Users can view and revoke individual sessions

### 4.2 Multi-Tenant Workspace Architecture

**Workspace Isolation**:
- Each workspace is a completely isolated data silo
- Users can belong to multiple workspaces with different roles
- Projects belong to exactly one workspace
- Tasks belong to exactly one project
- Labels are workspace-scoped

**Role Inheritance**:
```
Platform Role (Global)
  └─> Workspace Role (Workspace-scoped)
      └─> Project Role (Project-scoped)
```

**Permission Model**:
- Platform Admin: Bypasses all workspace restrictions
- Workspace roles control: Workspace settings, member management, project creation
- Project roles control: Task management, board configuration, project member management

### 4.3 Kanban Board System

**Board Structure**:
- Each project has one or more boards
- Boards contain columns (e.g., To Do, In Progress, Completed)
- Tasks belong to a single column
- Columns have positions for ordering
- One column can be marked as "completed column"

**Task Workflow**:
1. Tasks created in a column
2. Tasks moved between columns (drag-and-drop)
3. When moved to "completed column", `completedAt` timestamp set
4. Tasks can have multiple assignees
5. Tasks can have multiple labels (workspace-level tags)
6. Tasks support threaded comments
7. Tasks can have attachments

### 4.4 Real-Time Features

**Socket.IO Integration**:
- Real-time updates for:
  - Task creation/movement
  - Comment additions
  - Project/board changes
  - Member invitations
- Room-based authorization (workspace/project scoped)
- Redis adapter for multi-instance scaling (optional)

**Activity Logging**:
- All actions logged to activity stream
- Includes: actor, workspace, project, resource type, action, metadata
- Viewable in dashboard and project pages

### 4.5 Dashboard Functionality

**Dashboard Features**:
- Personalized greeting based on time of day
- User role badge display
- Workspace switcher
- Task filters: All, Pending, Due Soon, Urgent, Overdue, Completed
- Analytics tabs: Velocity, Status, Priority
- View modes: My Focus, Team Overview
- Quick actions: Create Task, Create Project, Invite Member
- Real-time metrics: Completion rate, overdue count, priority distribution

**Data Loaded on Dashboard**:
1. User dashboard stats (scoped to workspace if selected)
2. User's assigned tasks
3. Workspace projects (if workspace selected)
4. Workspace members (if workspace selected)
5. Recent activity stream (if workspace selected)

### 4.6 User Journey Example (Alice - Workspace Owner)

1. **Login**: Alice logs in with credentials
2. **Dashboard**: Sees personalized dashboard with her tasks
3. **Workspace Selection**: Selects "Acme Corp Engineering" (her workspace)
4. **Project View**: Sees "TeamFlow Core Engine" project
5. **Board View**: Opens Main Board with Kanban columns
6. **Task Management**:
   - Creates new task in "To Do" column
   - Assigns task to Bob
   - Adds "Backend" label
   - Sets priority to HIGH
7. **Real-time Update**: Bob sees task appear in real-time (Socket.IO)
8. **Project Management**:
   - Adds Charlie as project member with VIEWER role
   - Configures board columns
   - Views project analytics
9. **Workspace Management**:
   - Invites new member via email
   - Changes Bob's role to ADMIN
   - Creates new project "Mobile App"

---

## 5. Database Schema Overview

### Core Tables:
- **users**: Platform users with platform roles
- **workspaces**: Multi-tenant workspace containers
- **workspace_members**: Workspace membership with roles
- **projects**: Projects belonging to workspaces
- **project_members**: Project membership with roles
- **boards**: Kanban boards within projects
- **board_columns**: Columns within boards
- **tasks**: Tasks with assignees, labels, due dates
- **task_assignees**: Many-to-many task-user assignments
- **labels**: Workspace-level tags
- **task_labels**: Many-to-many task-label associations
- **comments**: Threaded comments on tasks
- **activity_logs**: Audit trail of all actions
- **notifications**: In-app notifications for users
- **refresh_tokens**: Session management for auth
- **password_reset_tokens**: Password reset flow
- **email_verification_tokens**: Email verification flow

### Relationships:
- Workspaces → Projects (1:N)
- Projects → Boards (1:N)
- Boards → Columns (1:N)
- Columns → Tasks (1:N)
- Tasks → Assignees (N:M)
- Tasks → Labels (N:M)
- Tasks → Comments (1:N)
- Users → Workspaces (N:M via workspace_members)
- Users → Projects (N:M via project_members)

---

## 6. Security Architecture

### 6.1 Authentication
- **Password Hashing**: Argon2id (memory-hard, GPU-resistant)
- **JWT Access Tokens**: 15-minute expiry, HMAC-SHA256
- **Refresh Tokens**: 7-day expiry, HTTP-only cookies, SHA-256 hashed in DB
- **Token Rotation**: Refresh tokens rotate on each use
- **Reuse Detection**: Compromised token detection invalidates entire family

### 6.2 Authorization
- **Middleware-based**: `authenticate`, `requireWorkspaceRole`, `requireProjectRole`
- **Strict Scoping**: Workspace and project roles are strictly scoped
- **Owner Protections**: Owner cannot be removed or downgraded
- **Cascade Restrictions**: Deleting workspace requires ownership transfer

### 6.3 API Security
- **Rate Limiting**: Auth endpoints limited
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for all endpoints
- **SQL Injection Protection**: Prisma ORM (parameterized queries)

---

## 7. Recommendations

### 7.1 Immediate Fixes Required
1. **Update Frontend API Routes**:
   - Change project list calls to use `/api/v1/projects/workspace/:id`
   - Change board list calls to use `/api/v1/boards/project/:id`
   - Update service files: `project.service.ts`, `board.service.ts`

2. **Test Dashboard Click Errors**:
   - Navigate to dashboard as each user role
   - Click on projects, boards, tasks
   - Verify no 404 errors occur
   - Check browser console for API errors

### 7.2 Documentation Updates
1. Update README.md to reflect port 8000 for local development
2. Add API route pattern documentation for frontend developers
3. Document role hierarchy and permission matrix

### 7.3 Enhancement Opportunities
1. Add Platform Admin workspace management UI
2. Implement workspace templates
3. Add task dependencies visualization
4. Implement file upload for attachments
5. Add email notification settings per user

---

## 8. Conclusion

TeamFlow implements a sophisticated, production-grade RBAC system with three distinct permission layers (Platform, Workspace, Project). The backend API is well-structured and secure, with proper token management and authorization middleware. The main issue identified is a potential frontend-backend route pattern mismatch that could cause 404 errors when navigating the dashboard. The authentication system is robust with proper security measures including Argon2id hashing, JWT token rotation, and reuse detection.

All demo accounts are correctly configured with appropriate roles:
- **Admin**: Platform-wide access (no workspaces assigned)
- **Alice**: Workspace Owner + Project Manager (full control)
- **Bob**: Workspace Admin + Project Member (can manage workspace and contribute to projects)
- **Charlie**: Workspace Member + Project Viewer (can view and comment)

The platform successfully demonstrates multi-tenant isolation, granular permissions, and real-time collaboration features suitable for enterprise project management.
