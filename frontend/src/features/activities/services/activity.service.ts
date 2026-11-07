import { api } from '../../../services/api';
import { ApiResponse, PaginatedResponse } from '../../../types/api.types';
import { ActivityLog } from '../../../types/activity.types';

export const activityService = {
  async getWorkspaceActivities(
    workspaceId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await api.get<ApiResponse<PaginatedResponse<ActivityLog>>>(
      `/activities/workspaces/${workspaceId}`,
      { params }
    );
    return response.data.data;
  },

  async getProjectActivities(
    projectId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await api.get<ApiResponse<PaginatedResponse<ActivityLog>>>(
      `/activities/projects/${projectId}`,
      { params }
    );
    return response.data.data;
  },
};
