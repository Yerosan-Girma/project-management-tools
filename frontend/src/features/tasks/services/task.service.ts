import { api } from '../../../services/api';
import { ApiResponse, PaginatedResult } from '../../../types/api.types';
import { Task, PriorityLevel } from '../../../types/task.types';

export interface CreateTaskInput {
  projectId: string;
  boardColumnId: string;
  title: string;
  description?: string;
  priority?: PriorityLevel;
  dueDate?: string;
  startDate?: string;
  assigneeIds?: string[];
  labels?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: PriorityLevel;
  dueDate?: string | null;
  startDate?: string | null;
  boardColumnId?: string;
}

export interface MoveTaskInput {
  destinationColumnId: string;
  newPosition: number;
}

export const taskService = {
  async getMyTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: PriorityLevel;
    workspaceId?: string;
  }): Promise<Task[] | PaginatedResult<Task>> {
    const response = await api.get<ApiResponse<Task[] | PaginatedResult<Task>>>('/tasks/my-assigned', {
      params,
    });
    return response.data.data;
  },

  async getProjectTasks(
    projectId: string,
    params?: { search?: string; status?: string; priority?: PriorityLevel; assigneeId?: string }
  ): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>(`/tasks/project/${projectId}`, {
      params,
    });
    return response.data.data;
  },

  async getTask(taskId: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },

  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  async updateTask(taskId: string, data: UpdateTaskInput): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}`, data);
    return response.data.data;
  },

  async moveTask(taskId: string, destinationColumnId: string, newPosition: number): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/move`, {
      destinationColumnId,
      newPosition,
    });
    return response.data.data;
  },

  async assignUsers(taskId: string, userIds: string[]): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/assign`, {
      userIds,
    });
    return response.data.data;
  },

  async unassignUser(taskId: string, userId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/assignees/${userId}`);
  },

  async setLabels(taskId: string, labels: string[]): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${taskId}/labels`, {
      labels,
    });
    return response.data.data;
  },

  async archiveTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },
};
