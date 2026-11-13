-- Safe Performance Composite Indexes Migration
-- Designed for PostgreSQL / Neon to optimize high-frequency filtering, sorting and joins

-- 1. Tasks composite indexes for project board & column lookups
CREATE INDEX IF NOT EXISTS "tasks_projectId_deletedAt_isArchived_position_idx"
    ON "tasks"("projectId", "deletedAt", "isArchived", "position");

CREATE INDEX IF NOT EXISTS "tasks_boardColumnId_deletedAt_isArchived_position_idx"
    ON "tasks"("boardColumnId", "deletedAt", "isArchived", "position");

-- 2. Projects composite index for workspace listing
CREATE INDEX IF NOT EXISTS "projects_workspaceId_deletedAt_isArchived_updatedAt_idx"
    ON "projects"("workspaceId", "deletedAt", "isArchived", "updatedAt" DESC);

-- 3. Notifications composite indexes for unread polling and chronological listing
CREATE INDEX IF NOT EXISTS "notifications_recipientId_isRead_idx"
    ON "notifications"("recipientId", "isRead");

CREATE INDEX IF NOT EXISTS "notifications_recipientId_createdAt_idx"
    ON "notifications"("recipientId", "createdAt" DESC);

-- 4. Activity logs composite indexes for workspace and project activity feeds
CREATE INDEX IF NOT EXISTS "activity_logs_workspaceId_createdAt_idx"
    ON "activity_logs"("workspaceId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "activity_logs_projectId_createdAt_idx"
    ON "activity_logs"("projectId", "createdAt" DESC);

-- 5. Workspace invitations composite indexes for pending checks and token validation
CREATE INDEX IF NOT EXISTS "workspace_invitations_workspaceId_status_idx"
    ON "workspace_invitations"("workspaceId", "status");

CREATE INDEX IF NOT EXISTS "workspace_invitations_email_status_idx"
    ON "workspace_invitations"("email", "status");

CREATE INDEX IF NOT EXISTS "workspace_invitations_projectId_status_idx"
    ON "workspace_invitations"("projectId", "status");

-- 6. Workspace members composite index
CREATE INDEX IF NOT EXISTS "workspace_members_userId_role_idx"
    ON "workspace_members"("userId", "role");
