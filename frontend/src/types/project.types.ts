import { User } from './auth.types';
import { Board } from './board.types';

export type ProjectRole = 'MANAGER' | 'MEMBER' | 'VIEWER';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatus;
  priority: PriorityLevel;
  startDate?: string | null;
  targetDate?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  members?: ProjectMember[];
  boards?: Board[];
  _count?: {
    tasks: number;
    members: number;
    boards: number;
  };
}

export interface ProjectOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  priorityDistribution: Record<PriorityLevel, number>;
  columnDistribution: Array<{
    columnId: string;
    name: string;
    color?: string | null;
    count: number;
  }>;
}
