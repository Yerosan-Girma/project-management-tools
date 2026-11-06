import { PriorityLevel } from './project.types';

export interface UserDashboardStats {
  workspacesCount: number;
  projects: {
    total: number;
    active: number;
  };
  tasks: {
    assignedTotal: number;
    completed: number;
    pending: number;
    overdue: number;
    upcomingWithin24h: number;
  };
}

export type DashboardStats = UserDashboardStats;

export interface ProjectAnalytics {
  project: {
    id: string;
    name: string;
    key: string;
    status: string;
    priority: string;
  };
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionPercentage: number;
  };
  priorityDistribution: Record<PriorityLevel, number>;
  memberWorkload: Array<{
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    assigned: number;
    completed: number;
  }>;
}

export interface ProjectReport {
  healthScore: number;
  healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  metrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  recommendations: string[];
}
