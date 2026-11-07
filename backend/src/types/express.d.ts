import { PlatformRole, WorkspaceRole, ProjectRole } from '../constants/roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: PlatformRole;
  emailVerifiedAt: Date | null;
  sessionId?: string;
}

export interface WorkspaceContext {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface ProjectContext {
  projectId: string;
  role: ProjectRole;
}

export interface TaskContext {
  taskId: string;
  role: ProjectRole;
  task?: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      workspaceContext?: WorkspaceContext;
      projectContext?: ProjectContext;
      taskContext?: TaskContext;
      requestId?: string;
    }
  }
}
