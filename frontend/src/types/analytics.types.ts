import { PriorityLevel } from './project.types';

export interface DashboardStats {
  workspacesCount: number;
  projectsCount: number;
  assignedTasksCount: number;
  overdueTasksCount: number;
  upcomingTasksCount: number;
}

export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  priorityBreakdown: Record<PriorityLevel, number>;
  memberWorkload: Array<{
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    taskCount: number;
    completedCount: number;
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
