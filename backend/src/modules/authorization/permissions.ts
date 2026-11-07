// ============================================================================
// CENTRALIZED PERMISSIONS CATALOG (PBAC) FOR TEAMFLOW
// ============================================================================

export type PlatformPermission =
  | 'platform:users:read'
  | 'platform:users:manage'
  | 'platform:workspaces:read'
  | 'platform:workspaces:manage'
  | 'platform:audit:read'
  | 'platform:settings:manage';

export type WorkspacePermission =
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'workspace:members:read'
  | 'workspace:members:invite'
  | 'workspace:members:remove'
  | 'workspace:members:manage_roles'
  | 'workspace:ownership:transfer'
  | 'workspace:projects:create'
  | 'workspace:projects:read'
  | 'workspace:labels:manage'
  | 'workspace:activity:read';

export type ProjectPermission =
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'project:members:read'
  | 'project:members:manage'
  | 'project:boards:manage'
  | 'project:columns:manage'
  | 'project:tasks:create'
  | 'project:tasks:read'
  | 'project:tasks:update'
  | 'project:tasks:move'
  | 'project:tasks:delete'
  | 'project:activity:read'
  | 'project:analytics:read';

export type TaskPermission =
  | 'task:read'
  | 'task:create'
  | 'task:update'
  | 'task:move'
  | 'task:assign'
  | 'task:labels:manage'
  | 'task:delete'
  | 'task:comments:read'
  | 'task:comments:create'
  | 'task:comments:update'
  | 'task:comments:delete'
  | 'task:attachments:upload'
  | 'task:attachments:delete';

export type Permission =
  | PlatformPermission
  | WorkspacePermission
  | ProjectPermission
  | TaskPermission;
