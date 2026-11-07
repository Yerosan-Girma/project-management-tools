import { User } from './auth.types';
import { Task } from './task.types';

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
  user?: User;
  task?: Task;
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
}

export type Activity = ActivityLog;
