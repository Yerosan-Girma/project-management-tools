export enum PlatformRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  USER = 'USER'
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export enum ProjectRole {
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

// Role hierarchy rank for comparisons
export const WorkspaceRoleRank: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 4,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.MEMBER]: 2,
  [WorkspaceRole.GUEST]: 1
};

export const ProjectRoleRank: Record<ProjectRole, number> = {
  [ProjectRole.MANAGER]: 3,
  [ProjectRole.MEMBER]: 2,
  [ProjectRole.VIEWER]: 1
};
