import { User } from './auth.types';

export interface ActivityLog {
  id: string;
  actorId: string;
  workspaceId: string;
  projectId?: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  metadata?: any;
  createdAt: string;
  actor?: User;
}
