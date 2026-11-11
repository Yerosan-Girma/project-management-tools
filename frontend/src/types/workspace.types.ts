import { User } from './auth.types';
import { ProjectRole } from './project.types';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  ownerId: string;
  role?: WorkspaceRole;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  members?: WorkspaceMember[];
  _count?: {
    members: number;
    projects: number;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  email: string;
  role: WorkspaceRole;
  projectRole?: ProjectRole | null;
  token: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  workspace?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
}
