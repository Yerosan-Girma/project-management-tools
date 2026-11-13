import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import { UserDashboardStats, ProjectAnalytics, ProjectReport } from '../../../types/analytics.types';
import { queryClient } from '../../../app/query-client';

export const analyticsService = {
  async getDashboardStats(workspaceId?: string): Promise<UserDashboardStats> {
    return queryClient.fetchQuery({
      queryKey: ['dashboard-stats', workspaceId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<UserDashboardStats>>('/analytics/dashboard', {
          params: workspaceId ? { workspaceId } : undefined,
        });
        return response.data.data;
      },
      staleTime: 1000 * 20, // 20 seconds cache
    });
  },

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    return queryClient.fetchQuery({
      queryKey: ['project-analytics', projectId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<ProjectAnalytics>>(
          `/analytics/projects/${projectId}`
        );
        return response.data.data;
      },
      staleTime: 1000 * 30,
    });
  },

  async getProjectReports(projectId: string): Promise<ProjectReport> {
    return queryClient.fetchQuery({
      queryKey: ['project-reports', projectId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<ProjectReport>>(
          `/analytics/projects/${projectId}/reports`
        );
        return response.data.data;
      },
      staleTime: 1000 * 30,
    });
  },
};
