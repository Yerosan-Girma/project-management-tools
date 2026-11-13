import { api } from '../../../services/api';
import { ApiResponse, PaginatedResponse } from '../../../types/api.types';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
} from '../../../types/workspace.types';
import { queryClient } from '../../../app/query-client';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    return queryClient.fetchQuery({
      queryKey: ['workspaces'],
      queryFn: async () => {
        const response = await api.get<ApiResponse<Workspace[]>>('/workspaces');
        return response.data.data;
      },
      staleTime: 1000 * 30, // 30s cache
    });
  },

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    return queryClient.fetchQuery({
      queryKey: ['workspace', workspaceId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`);
        return response.data.data;
      },
      staleTime: 1000 * 30,
    });
  },

  async createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
    const response = await api.post<ApiResponse<Workspace>>('/workspaces', data);
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    return response.data.data;
  },

  async updateWorkspace(workspaceId: string, data: UpdateWorkspaceInput): Promise<Workspace> {
    const response = await api.patch<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`, data);
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    return response.data.data;
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}`);
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  },

  async getMembers(
    workspaceId: string,
    params?: { page?: number; limit?: number; query?: string; role?: WorkspaceRole }
  ): Promise<PaginatedResponse<WorkspaceMember>> {
    const response = await api.get<ApiResponse<PaginatedResponse<WorkspaceMember>>>(
      `/workspaces/${workspaceId}/members`,
      { params }
    );
    return response.data.data;
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    const response = await api.patch<ApiResponse<WorkspaceMember>>(
      `/workspaces/${workspaceId}/members/${userId}/role`,
      { role }
    );
    return response.data.data;
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  async transferOwnership(workspaceId: string, newOwnerUserId: string): Promise<Workspace> {
    const response = await api.post<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}/transfer-ownership`,
      { newOwnerUserId }
    );
    return response.data.data;
  },

  async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    const response = await api.get<ApiResponse<WorkspaceInvitation[]>>(
      `/invitations/workspaces/${workspaceId}`
    );
    return response.data.data;
  },

  async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole = 'MEMBER'
  ): Promise<WorkspaceInvitation> {
    const response = await api.post<ApiResponse<WorkspaceInvitation>>(
      `/invitations/workspaces/${workspaceId}`,
      { email, role }
    );
    return response.data.data;
  },

  async cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await api.delete(`/invitations/workspaces/${workspaceId}/${invitationId}`);
  },

  async resendInvitation(workspaceId: string, invitationId: string): Promise<WorkspaceInvitation> {
    const response = await api.post<ApiResponse<WorkspaceInvitation>>(
      `/invitations/workspaces/${workspaceId}/${invitationId}/resend`
    );
    return response.data.data;
  },

  async getInvitationDetails(token: string): Promise<WorkspaceInvitation> {
    const response = await api.get<ApiResponse<WorkspaceInvitation>>(`/invitations/details/${token}`);
    return response.data.data;
  },

  async getMyPendingInvitations(): Promise<WorkspaceInvitation[]> {
    const response = await api.get<ApiResponse<WorkspaceInvitation[]>>('/invitations/my-pending');
    return response.data.data;
  },

  async acceptInvitation(token: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/invitations/accept', { token });
    return response.data.data;
  },

  async rejectInvitation(token: string): Promise<void> {
    await api.post('/invitations/reject', { token });
  },
};
