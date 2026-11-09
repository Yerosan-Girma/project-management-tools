import { apiClient } from '../../../services/api';

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  platformAdminsCount: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string;
    createdAt: string;
    metadata?: Record<string, any>;
    actor: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
    };
  }>;
}

export interface PlatformUserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  platformRole: 'PLATFORM_ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    workspaceMemberships: number;
    projectMemberships: number;
    taskAssignments?: number;
  };
}

export interface UserHierarchyDetails {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  platformRole: 'PLATFORM_ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceMemberships: Array<{
    role: string;
    workspace: { id: string; name: string; slug: string; ownerId?: string };
  }>;
  projectMemberships: Array<{
    role: string;
    project: {
      id: string;
      name: string;
      key: string;
      status: string;
      priority: string;
      workspaceId: string;
    };
  }>;
  taskAssignments: Array<{
    task: {
      id: string;
      title: string;
      priority: string;
      dueDate?: string | null;
      column?: { id: string; name: string; color?: string | null } | null;
      projectId: string;
      project: { id: string; name: string; key: string };
    };
  }>;
}

export interface ListPlatformUsersParams {
  search?: string;
  role?: 'PLATFORM_ADMIN' | 'USER';
  status?: 'ACTIVE' | 'SUSPENDED';
  page?: number;
  limit?: number;
}

class UserService {
  async getPlatformStats(): Promise<PlatformStats> {
    const res = await apiClient.get<{ success: boolean; data: PlatformStats }>('/users/stats/overview');
    return res.data.data;
  }

  async getPlatformUsers(params?: ListPlatformUsersParams): Promise<{ items: PlatformUserItem[]; total: number }> {
    const res = await apiClient.get<{ success: boolean; data: { items: PlatformUserItem[]; total: number } }>('/users', {
      params,
    });
    return res.data.data;
  }

  async getUserHierarchy(userId: string): Promise<UserHierarchyDetails> {
    const res = await apiClient.get<{ success: boolean; data: UserHierarchyDetails }>(`/users/${userId}`);
    return res.data.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  async updatePlatformRole(userId: string, platformRole: 'PLATFORM_ADMIN' | 'USER'): Promise<PlatformUserItem> {
    const res = await apiClient.patch<{ success: boolean; data: PlatformUserItem }>(`/users/${userId}/platform-role`, {
      platformRole,
    });
    return res.data.data;
  }

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<PlatformUserItem> {
    const res = await apiClient.patch<{ success: boolean; data: PlatformUserItem }>(`/users/${userId}/status`, {
      status,
    });
    return res.data.data;
  }
}

export const userService = new UserService();
