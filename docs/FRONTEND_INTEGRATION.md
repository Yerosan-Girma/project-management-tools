# TeamFlow Frontend-to-Backend Integration Specification

This document details the actual backend implementation contracts for the TeamFlow frontend application.

## 1. Environment & Network Configuration

- **API Base URL**: `http://localhost:5000/api/v1`
- **Swagger / OpenAPI Spec**: `http://localhost:5000/api/docs.json`
- **Health Check**: `http://localhost:5000/health`
- **Socket.IO Endpoint**: `http://localhost:5000`
- **CORS Allowed Origins**: `http://localhost:3000`, `http://localhost:5173` with `credentials: true`

---

## 2. Standard Response & Error Envelope

### Standard Success Response
Every successful API call returns HTTP `200` or `201` with:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```
For paginated list endpoints, `data` is formatted as:
```json
{
  "items": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Standard Error Response
Error statuses (`400`, `401`, `403`, `404`, `409`, `429`, `500`) return:
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": [
      {
        "field": "key",
        "message": "Project key must be alphanumeric uppercase"
      }
    ]
  }
}
```

---

## 3. Authentication & Session Strategy

### Dual-Token Architecture
1. **Access Token**: Short-lived JWT (15 minutes). Sent in the `Authorization: Bearer <accessToken>` header on all protected requests.
2. **Refresh Token**: Stored securely as an `HttpOnly` cookie named `refreshToken` on `/api/v1/auth`, and also optionally returned in login/register response bodies (`data.tokens.refreshToken`).
3. **Session Revocation & Rotation**:
   - `POST /api/v1/auth/refresh` accepts `{ refreshToken?: string }` (or reads from cookie) and rotates both tokens.
   - Reusing an old/revoked refresh token revokes the entire token family automatically.

### User Profile Shape (`User`)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  platformRole: 'PLATFORM_ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  createdAt: string;
}
```

---

## 4. Socket.IO Real-Time Architecture

- **Connection**:
  ```typescript
  import { io } from 'socket.io-client';
  const socket = io('http://localhost:5000', {
    auth: { token: accessToken },
    transports: ['websocket', 'polling']
  });
  ```
- **Room Handlers**:
  - `workspace:join` (`{ workspaceId: string }`, ack callback `({ success: boolean, room?: string })`): verifies workspace membership before joining room `workspace:<workspaceId>`.
  - `workspace:leave` (`{ workspaceId: string }`)
  - `project:join` (`{ projectId: string }`, ack callback `({ success: boolean, room?: string })`): verifies project membership or workspace admin rights before joining `project:<projectId>`.
  - `project:leave` (`{ projectId: string }`)
- **Direct User Room**:
  - Each socket automatically joins `user:<userId>` upon connection.
- **Broadcast Events**:
  - `notification:new`: Dispatched to `user:<recipientId>`.
  - `task:created`, `task:updated`, `task:moved`, `task:assigned`, `task:deleted`: Dispatched to `project:<projectId>`.
  - `comment:created`: Dispatched to `project:<projectId>`.
  - `project:updated`: Dispatched to `project:<projectId>` and `workspace:<workspaceId>`.
  - `member:joined`, `member:removed`: Dispatched to `workspace:<workspaceId>`.

---

## 5. Module Endpoints & Request Body Schemas

### 5.1 Authentication (`/auth`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | None | `{ name, email, password }` | Register account |
| `POST` | `/auth/login` | None | `{ email, password }` | Authenticate |
| `POST` | `/auth/refresh` | None | `{ refreshToken?: string }` | Rotate tokens |
| `POST` | `/auth/logout` | Optional | None | Invalidate session |
| `GET` | `/auth/me` | Bearer | None | Current user profile |
| `GET` | `/auth/sessions` | Bearer | None | List user sessions |
| `DELETE` | `/auth/sessions/:id` | Bearer | None | Revoke session |
| `POST` | `/auth/forgot-password` | None | `{ email }` | Password reset email |
| `POST` | `/auth/reset-password` | None | `{ token, password }` | Set new password |
| `POST` | `/auth/verify-email` | None | `{ token }` | Verify account |

### 5.2 Users (`/users`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/users/search?query=` | Bearer | None | Search platform users |
| `PATCH` | `/users/profile` | Bearer | `{ name?, avatarUrl? }` | Update profile info |
| `POST` | `/users/change-password` | Bearer | `{ currentPassword, newPassword }` | Update password |

### 5.3 Workspaces (`/workspaces`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/workspaces` | Bearer | `{ name, description?, avatarUrl? }` | Create workspace |
| `GET` | `/workspaces` | Bearer | None | List user workspaces |
| `GET` | `/workspaces/:workspaceId` | Bearer | None | Workspace details |
| `PATCH` | `/workspaces/:workspaceId` | Bearer | `{ name?, description?, avatarUrl? }` | Update workspace |
| `DELETE` | `/workspaces/:workspaceId` | Bearer | None | Archive workspace |
| `GET` | `/workspaces/:workspaceId/members` | Bearer | None (query: `page`, `limit`, `query`, `role`) | Paginated members |
| `PATCH` | `/workspaces/:workspaceId/members/:memberId/role` | Bearer | `{ role: 'ADMIN' \| 'MEMBER' \| 'GUEST' }` | Update member role (`:memberId` is user UUID) |
| `DELETE` | `/workspaces/:workspaceId/members/:memberId` | Bearer | None | Remove member (`:memberId` is user UUID) |
| `POST` | `/workspaces/:workspaceId/transfer-ownership` | Bearer | `{ newOwnerUserId }` | Transfer ownership |

### 5.4 Invitations (`/invitations`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/invitations/workspaces/:workspaceId` | Bearer | `{ email, role }` | Send invitation |
| `GET` | `/invitations/workspaces/:workspaceId` | Bearer | None | List pending invitations |
| `GET` | `/invitations/details/:token` | None | None | Get invite details |
| `POST` | `/invitations/accept` | Bearer | `{ token }` | Accept invitation |
| `POST` | `/invitations/reject` | Bearer | `{ token }` | Reject invitation |
| `DELETE` | `/invitations/workspaces/:workspaceId/:invitationId` | Bearer | None | Cancel invitation |

### 5.5 Projects (`/projects`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/projects` | Bearer | `{ workspaceId, name, key, description?, priority?, startDate?, targetDate? }` | Create project (auto-creates default board & 4 columns) |
| `GET` | `/projects/workspace/:workspaceId` | Bearer | None (query: `status`, `priority`) | List workspace projects |
| `GET` | `/projects/:projectId` | Bearer | None | Project details with members and boards |
| `PATCH` | `/projects/:projectId` | Bearer | `{ name?, description?, status?, priority?, startDate?, targetDate? }` | Update project |
| `DELETE` | `/projects/:projectId` | Bearer | None | Archive project |
| `GET` | `/projects/:projectId/overview` | Bearer | None | Project summary & progress metrics |
| `GET` | `/projects/:projectId/activity` | Bearer | None | Project activity log |
| `POST` | `/projects/:projectId/members` | Bearer | `{ userId, role? }` | Add member |
| `PATCH` | `/projects/:projectId/members/:userId` | Bearer | `{ role }` | Update member role |
| `DELETE` | `/projects/:projectId/members/:userId` | Bearer | None | Remove project member |

### 5.6 Boards & Columns (`/boards`, `/columns`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/boards/project/:projectId` | Bearer | None | List project boards & columns |
| `POST` | `/boards` | Bearer | `{ projectId, name, description?, position? }` | Create board |
| `GET` | `/boards/:boardId` | Bearer | None | Get board details |
| `PATCH` | `/boards/:boardId` | Bearer | `{ name?, description?, position? }` | Update board |
| `DELETE` | `/boards/:boardId` | Bearer | None | Delete board |
| `POST` | `/columns` | Bearer | `{ boardId, name, color?, taskLimit?, isCompletedColumn?, position? }` | Create column |
| `GET` | `/columns/:columnId` | Bearer | None | Get column |
| `PATCH` | `/columns/:columnId` | Bearer | `{ name?, color?, taskLimit?, isCompletedColumn?, position? }` | Update column |
| `POST` | `/columns/reorder` | Bearer | `{ boardId, columns: [{ id, position }] }` | Reorder columns |
| `DELETE` | `/columns/:columnId` | Bearer | `{ targetColumnId? }` | Delete column |

### 5.7 Tasks (`/tasks`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/tasks` | Bearer | `{ projectId, boardColumnId, title, description?, priority?, dueDate?, startDate?, assigneeIds?, labelIds? }` | Create task |
| `GET` | `/tasks/project/:projectId` | Bearer | Query: `boardColumnId`, `priority`, `assigneeId`, `labelId`, `search`, `page`, `limit` | Paginated tasks |
| `GET` | `/tasks/my-assigned` | Bearer | None | Current user's assigned tasks |
| `GET` | `/tasks/:taskId` | Bearer | None | Task details with assignees, labels, comments |
| `PATCH` | `/tasks/:taskId` | Bearer | `{ title?, description?, priority?, dueDate?, startDate?, isArchived? }` | Update task |
| `POST` | `/tasks/:taskId/move` | Bearer | `{ destinationColumnId, newPosition }` | Move task |
| `POST` | `/tasks/:taskId/assign` | Bearer | `{ userIds: string[] }` | Assign users |
| `DELETE` | `/tasks/:taskId/assignees/:userId` | Bearer | None | Unassign user |
| `PUT` | `/tasks/:taskId/labels` | Bearer | `{ labelIds: string[] }` | Synchronize labels |
| `DELETE` | `/tasks/:taskId` | Bearer | None | Archive task |

### 5.8 Labels (`/labels`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/labels` | Bearer | `{ workspaceId, name, color }` (Hex code e.g. `#3B82F6`) | Create label |
| `GET` | `/labels/workspace/:workspaceId` | Bearer | None | List workspace labels |
| `PATCH` | `/labels/:labelId` | Bearer | `{ name?, color? }` | Update label |
| `DELETE` | `/labels/:labelId` | Bearer | None | Delete label |

### 5.9 Comments (`/api/v1`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/tasks/:taskId/comments` | Bearer | `{ content, parentId? }` | Create comment or threaded reply |
| `GET` | `/tasks/:taskId/comments` | Bearer | None | List task comments & replies |
| `PATCH` | `/comments/:commentId` | Bearer | `{ content }` | Edit own comment |
| `DELETE` | `/comments/:commentId` | Bearer | None | Delete comment |

### 5.10 Notifications (`/notifications`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/notifications` | Bearer | Query: `unread=true`, `page`, `limit` | Paginated notifications |
| `GET` | `/notifications/unread-count` | Bearer | None | Unread count `{ unreadCount: number }` |
| `PATCH` | `/notifications/:id/read` | Bearer | None | Mark single notification read |
| `PATCH` | `/notifications/read-all` | Bearer | None | Mark all notifications read |
| `DELETE` | `/notifications/:id` | Bearer | None | Delete notification |

### 5.11 Activities (`/activities`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/activities/workspaces/:workspaceId` | Bearer | Query: `page`, `limit` | Paginated workspace activity log |
| `GET` | `/activities/projects/:projectId` | Bearer | Query: `page`, `limit` | Paginated project activity log |

### 5.12 Analytics (`/analytics`)
| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `GET` | `/analytics/dashboard` | Bearer | None | High-level metrics: total workspaces, projects, assigned tasks, overdue & upcoming count |
| `GET` | `/analytics/projects/:projectId` | Bearer | None | Project metrics: total, completed, pending, overdue, completion percentage, priority breakdown, member workload |
| `GET` | `/analytics/projects/:projectId/activity` | Bearer | None | Aggregated project activity stats |
| `GET` | `/analytics/projects/:projectId/reports` | Bearer | None | Project health evaluation and status indicators |
