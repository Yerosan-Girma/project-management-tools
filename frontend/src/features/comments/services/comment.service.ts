import { api } from '../../../services/api';
import { ApiResponse, PaginatedResult } from '../../../types/api.types';
import { Comment } from '../../../types/comment.types';

export const commentService = {
  async getTaskComments(
    taskId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResult<Comment>> {
    const response = await api.get<ApiResponse<PaginatedResult<Comment>>>(
      `/tasks/${taskId}/comments`,
      { params }
    );
    return response.data.data;
  },

  async createComment(
    taskId: string,
    content: string,
    parentId?: string | null
  ): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, {
      content,
      parentId: parentId || undefined,
    });
    return response.data.data;
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await api.patch<ApiResponse<Comment>>(`/comments/${commentId}`, {
      content,
    });
    return response.data.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },
};
