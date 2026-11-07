import { PlatformRole, WorkspaceRole, ProjectRole } from '../../constants/roles';
import {
  PlatformPermission,
  WorkspacePermission,
  ProjectPermission,
  TaskPermission,
} from './permissions';

// ============================================================================
// 1. PLATFORM ROLES TO PERMISSIONS
// ============================================================================

export const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, readonly PlatformPermission[]> = {
  [PlatformRole.PLATFORM_ADMIN]: [
    'platform:users:read',
    'platform:users:manage',
    'platform:workspaces:read',
    'platform:workspaces:manage',
    'platform:audit:read',
    'platform:settings:manage',
  ],
  [PlatformRole.USER]: [],
} as const;

// ============================================================================
// 2. WORKSPACE ROLES TO PERMISSIONS
// ============================================================================

export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, readonly WorkspacePermission[]> = {
  [WorkspaceRole.OWNER]: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'workspace:members:read',
    'workspace:members:invite',
    'workspace:members:remove',
    'workspace:members:manage_roles',
    'workspace:ownership:transfer',
    'workspace:projects:create',
    'workspace:projects:read',
    'workspace:labels:manage',
    'workspace:activity:read',
  ],
  [WorkspaceRole.ADMIN]: [
    'workspace:read',
    'workspace:update',
    'workspace:members:read',
    'workspace:members:invite',
    'workspace:members:remove',
    'workspace:members:manage_roles',
    'workspace:projects:create',
    'workspace:projects:read',
    'workspace:labels:manage',
    'workspace:activity:read',
  ],
  [WorkspaceRole.MEMBER]: [
    'workspace:read',
    'workspace:members:read',
    'workspace:projects:read',
    'workspace:activity:read',
  ],
  [WorkspaceRole.GUEST]: [
    'workspace:read',
  ],
} as const;

// ============================================================================
// 3. PROJECT ROLES TO PERMISSIONS
// ============================================================================

export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, readonly (ProjectPermission | TaskPermission)[]> = {
  [ProjectRole.MANAGER]: [
    'project:read',
    'project:update',
    'project:delete',
    'project:members:read',
    'project:members:manage',
    'project:boards:manage',
    'project:columns:manage',
    'project:tasks:create',
    'project:tasks:read',
    'project:tasks:update',
    'project:tasks:delete',
    'project:activity:read',
    'project:analytics:read',
    'task:read',
    'task:create',
    'task:update',
    'task:move',
    'task:assign',
    'task:labels:manage',
    'task:delete',
    'task:comments:read',
    'task:comments:create',
    'task:comments:update',
    'task:comments:delete',
    'task:attachments:upload',
    'task:attachments:delete',
  ],
  [ProjectRole.MEMBER]: [
    'project:read',
    'project:members:read',
    'project:tasks:create',
    'project:tasks:read',
    'project:tasks:update',
    'project:tasks:move',
    'project:activity:read',
    'task:read',
    'task:create',
    'task:update',
    'task:move',
    'task:assign',
    'task:labels:manage',
    'task:comments:read',
    'task:comments:create',
    'task:comments:update',
    'task:attachments:upload',
  ],
  [ProjectRole.VIEWER]: [
    'project:read',
    'project:members:read',
    'project:tasks:read',
    'project:activity:read',
    'project:analytics:read',
    'task:read',
    'task:comments:read',
  ],
} as const;
