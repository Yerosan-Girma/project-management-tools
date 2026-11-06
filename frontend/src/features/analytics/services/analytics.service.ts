import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import { UserDashboardStats, ProjectAnalytics, ProjectReport } from '../../../types/analytics.types';

export const analyticsService = {
  async getDashboardStats(): Promise<UserDashboardStats> {
    const response = await api.get<ApiResponse<UserDashboardStats>>('/analytics/dashboard');
    return response.data.data;
  },

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const response = await api.get<ApiResponse<ProjectAnalytics>>(
      `/analytics/projects/${projectId}`
    );
    return response.data.data;
  },

  async getProjectReports(projectId: string): Promise<ProjectReport> {
    const response = await api.get<ApiResponse<ProjectReport>>(
      `/analytics/projects/${projectId}/reports`
    );
    return response.data.data;
  },
};
