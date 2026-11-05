# TeamFlow Backend — REST API & Real-time Specification

## Base URL
`/api/v1`

Interactive OpenAPI / Swagger UI: `http://localhost:5000/api/docs`
Raw OpenAPI JSON: `http://localhost:5000/api/docs.json`
Health Check: `http://localhost:5000/health`

---

## Standard Response Format

### Success Response (`200`, `201`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `429`, `500`)
```json
{
  "success": false,
  "message": "Meaningful error explanation",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

---

## 1. Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register new user account. Returns user profile, access & refresh token. |
| `POST` | `/api/v1/auth/login` | None | Authenticate with email and password. Sets HttpOnly cookie & returns tokens. |
| `POST` | `/api/v1/auth/refresh` | None | Rotate refresh token and issue fresh short-lived access token. |
| `POST` | `/api/v1/auth/logout` | Optional | Invalidate current session and clear refresh token cookie. |
| `POST` | `/api/v1/auth/verify-email` | None | Verify account using one-time token sent via email. |
| `POST` | `/api/v1/auth/forgot-password` | None | Request password reset email (rate-limited). |
| `POST` | `/api/v1/auth/reset-password` | None | Reset account password using token and revoke all active sessions. |
| `GET` | `/api/v1/auth/me` | Bearer | Get authenticated user profile. |
| `GET` | `/api/v1/auth/sessions` | Bearer | List active sessions (device, IP, creation date). |
| `DELETE` | `/api/v1/auth/sessions/:id` | Bearer | Revoke a specific session. |

---

## 2. User Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PATCH` | `/api/v1/users/profile` | Bearer | Update user profile (name, avatarUrl). |
| `POST` | `/api/v1/users/change-password` | Bearer | Change password after validating current password. |
| `GET` | `/api/v1/users/search?query=` | Bearer | Search platform users for assignment or workspace invitation. |

---

## 3. Workspace Endpoints

| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/workspaces` | Authenticated | Create a new workspace (creator becomes OWNER with default labels). |
| `GET` | `/api/v1/workspaces` | Authenticated | List all workspaces the user is a member of. |
| `GET` | `/api/v1/workspaces/:workspaceId` | GUEST+ | Get workspace details, members preview, and project counts. |
| `PATCH` | `/api/v1/workspaces/:workspaceId` | ADMIN+ | Update workspace name, description, avatar. |
| `DELETE` | `/api/v1/workspaces/:workspaceId` | OWNER | Soft-archive workspace. |
| `GET` | `/api/v1/workspaces/:workspaceId/members` | GUEST+ | List paginated members with search and role filtering. |
| `PATCH` | `/api/v1/workspaces/:workspaceId/members/:memberId/role` | ADMIN+ | Update member role (`ADMIN`, `MEMBER`, `GUEST`). |
| `DELETE` | `/api/v1/workspaces/:workspaceId/members/:memberId` | ADMIN+ | Remove member from workspace (cannot remove OWNER). |
| `POST` | `/api/v1/workspaces/:workspaceId/transfer-ownership` | OWNER | Transfer workspace ownership to another member. |

---

## 4. Workspace Invitations Endpoints

| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/invitations/workspaces/:workspaceId` | ADMIN+ | Send invitation email with secure token. |
| `GET` | `/api/v1/invitations/workspaces/:workspaceId` | ADMIN+ | List pending invitations for this workspace. |
| `DELETE` | `/api/v1/invitations/workspaces/:workspaceId/:id` | ADMIN+ | Cancel pending invitation. |
| `GET` | `/api/v1/invitations/details/:token` | None | Verify invitation token before accepting. |
| `POST` | `/api/v1/invitations/accept` | Authenticated | Accept invitation and join workspace. |
| `POST` | `/api/v1/invitations/reject` | Authenticated | Reject invitation. |

---

## 5. Project Endpoints

| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects` | Workspace ADMIN+ | Create project; atomically generates Main Board and 4 Kanban columns. |
| `GET` | `/api/v1/projects/workspace/:workspaceId` | GUEST+ | List accessible projects in workspace (supports status/priority filters). |
| `GET` | `/api/v1/projects/:projectId` | VIEWER+ | Get project details, boards, members, task counts. |
| `PATCH` | `/api/v1/projects/:projectId` | MANAGER+ | Update project metadata, status, target date. |
| `DELETE` | `/api/v1/projects/:projectId` | MANAGER+ | Archive project. |
| `GET` | `/api/v1/projects/:projectId/overview` | VIEWER+ | Aggregate metrics: completion %, column counts, overdue tasks. |
| `GET` | `/api/v1/projects/:projectId/activity` | VIEWER+ | Project audit activity trail. |
| `POST` | `/api/v1/projects/:projectId/members` | MANAGER+ | Add member to project (must already belong to workspace). |
| `PATCH` | `/api/v1/projects/:projectId/members/:userId` | MANAGER+ | Update project member role (`MANAGER`, `MEMBER`, `VIEWER`). |
| `DELETE` | `/api/v1/projects/:projectId/members/:userId` | MANAGER+ | Remove member from project. |

---

## 6. Boards & Columns Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/boards` | Create board in project. |
| `GET` | `/api/v1/boards/project/:projectId` | List all boards in project with columns and task counts. |
| `GET` | `/api/v1/boards/:boardId` | Get board details. |
| `PATCH` | `/api/v1/boards/:boardId` | Update board name, description, position. |
| `DELETE` | `/api/v1/boards/:boardId` | Archive board (cannot archive default board). |
| `POST` | `/api/v1/columns` | Create column in board (`name`, `position`, `color`, `isCompletedColumn`). |
| `POST` | `/api/v1/columns/reorder` | Batch reorder columns by numeric position. |
| `GET` | `/api/v1/columns/:columnId` | Get column details. |
| `PATCH` | `/api/v1/columns/:columnId` | Update column. |
| `DELETE` | `/api/v1/columns/:columnId` | Delete column. Requires `targetColumnId` if column contains tasks. |

---

## 7. Tasks Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/tasks` | Create task in project column with assignees, labels, due date. |
| `GET` | `/api/v1/tasks/project/:projectId` | List tasks in project with filtering (column, assignee, priority, label, search, date range). |
| `GET` | `/api/v1/tasks/my-assigned` | List all tasks assigned to the current user across accessible projects. |
| `GET` | `/api/v1/tasks/:taskId` | Get task details with assignees, labels, attachments, comments count. |
| `PATCH` | `/api/v1/tasks/:taskId` | Update task title, description, priority, dates, archive status. |
| `POST` | `/api/v1/tasks/:taskId/move` | Drag-and-drop task move (`destinationColumnId`, `newPosition`). Automatically updates `completedAt` if destination column is a completion column. |
| `POST` | `/api/v1/tasks/:taskId/assign` | Assign multiple project members to task. Prevents duplicates and non-members. |
| `DELETE` | `/api/v1/tasks/:taskId/assignees/:userId` | Remove assignee from task. |
| `PUT` | `/api/v1/tasks/:taskId/labels` | Synchronize labels on task. |
| `DELETE` | `/api/v1/tasks/:taskId` | Archive task. |

---

## 8. Labels Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/labels` | Create custom workspace label (`name`, `color`). |
| `GET` | `/api/v1/labels/workspace/:workspaceId` | List labels in workspace. |
| `PATCH` | `/api/v1/labels/:labelId` | Update label name and color. |
| `DELETE` | `/api/v1/labels/:labelId` | Delete label from workspace. |

---

## 9. Comments Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/tasks/:taskId/comments` | Post comment or threaded reply (`parentId`) on task. |
| `GET` | `/api/v1/tasks/:taskId/comments` | List all comments and threaded replies for task. |
| `PATCH` | `/api/v1/comments/:commentId` | Edit own comment (marks `isEdited: true`). |
| `DELETE` | `/api/v1/comments/:commentId` | Delete comment (allowed by author, project manager, or workspace admin). |

---

## 10. Notifications Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/notifications` | List user notifications (supports `?unread=true` and pagination). |
| `GET` | `/api/v1/notifications/unread-count` | Get unread notifications counter. |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark individual notification as read. |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all notifications as read. |
| `DELETE` | `/api/v1/notifications/:id` | Delete notification. |

---

## 11. Analytics Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/dashboard` | User dashboard: workspaces, project counts, assigned task metrics, overdue/upcoming tasks. |
| `GET` | `/api/v1/analytics/projects/:projectId` | Project metrics: total, completed, pending, overdue, completion %, priority breakdown, member workload. |
| `GET` | `/api/v1/analytics/projects/:projectId/activity` | Project audit logs. |
| `GET` | `/api/v1/analytics/projects/:projectId/reports` | Project health and progress report. |

---

## 12. Real-Time Socket.IO Architecture

Connect:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: '<YOUR_JWT_ACCESS_TOKEN>' },
  transports: ['websocket']
});
```

### Room Subscriptions:
- `workspace:join` (`{ workspaceId }`): Authenticated workspace membership check before joining `workspace:<id>`
- `workspace:leave` (`{ workspaceId }`)
- `project:join` (`{ projectId }`): Authenticated project membership check before joining `project:<id>`
- `project:leave` (`{ projectId }`)

### Broadcasted Events:
- `task:created`
- `task:updated`
- `task:moved`
- `task:assigned`
- `task:deleted`
- `column:created`
- `column:updated`
- `column:reordered`
- `column:deleted`
- `comment:created`
- `project:updated`
- `notification:new`
- `member:joined`
- `member:removed`
