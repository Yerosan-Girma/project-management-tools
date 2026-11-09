import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import {
  Project,
  ProjectOverview,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  PriorityLevel,
} from '../../../types/project.types';
import { Activity } from '../../../types/activity.types';
import { WorkspaceInvitation } from '../../../types/workspace.types';

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  priority?: PriorityLevel;
  startDate?: string;
  targetDate?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: PriorityLevel;
  startDate?: string;
  targetDate?: string;
}

export const projectService = {
  async createProject(data: CreateProjectInput): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return response.data.data;
  },

  async getWorkspaceProjects(
    workspaceId: string,
    params?: { status?: ProjectStatus; priority?: PriorityLevel }
  ): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>(
      `/projects/workspace/${workspaceId}`,
      { params }
    );
    return response.data.data;
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
    return response.data.data;
  },

  async updateProject(projectId: string, data: UpdateProjectInput): Promise<Project> {
    const response = await api.patch<ApiResponse<Project>>(`/projects/${projectId}`, data);
    return response.data.data;
  },

  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },

  async getProjectOverview(projectId: string): Promise<ProjectOverview> {
    const response = await api.get<ApiResponse<ProjectOverview>>(
      `/projects/${projectId}/overview`
    );
    return response.data.data;
  },

  async getProjectActivity(projectId: string): Promise<Activity[]> {
    const response = await api.get<ApiResponse<Activity[]>>(
      `/projects/${projectId}/activity`
    );
    return response.data.data;
  },

  async addProjectMember(
    projectId: string,
    userId: string,
    role: ProjectRole = 'MEMBER'
  ): Promise<ProjectMember> {
    const response = await api.post<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members`,
      { userId, role }
    );
    return response.data.data;
  },

  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): Promise<ProjectMember> {
    const response = await api.patch<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { role }
    );
    return response.data.data;
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  async getProjectInvitations(projectId: string): Promise<WorkspaceInvitation[]> {
    const response = await api.get<ApiResponse<WorkspaceInvitation[]>>(
      `/invitations/projects/${projectId}`
    );
    return response.data.data;
  },

  async inviteProjectMember(
    projectId: string,
    email: string,
    role: ProjectRole = 'MEMBER'
  ): Promise<WorkspaceInvitation> {
    const response = await api.post<ApiResponse<WorkspaceInvitation>>(
      `/invitations/projects/${projectId}`,
      { email, role }
    );
    return response.data.data;
  },

  async resendProjectInvitation(projectId: string, invitationId: string): Promise<WorkspaceInvitation> {
    const response = await api.post<ApiResponse<WorkspaceInvitation>>(
      `/invitations/projects/${projectId}/${invitationId}/resend`
    );
    return response.data.data;
  },

  async cancelProjectInvitation(projectId: string, invitationId: string): Promise<void> {
    await api.delete(`/invitations/projects/${projectId}/${invitationId}`);
  },
};
