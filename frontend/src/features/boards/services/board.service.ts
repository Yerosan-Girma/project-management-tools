import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import { Board, BoardColumn } from '../../../types/board.types';
import { queryClient } from '../../../app/query-client';

export interface CreateColumnInput {
  boardId: string;
  name: string;
  color?: string;
  taskLimit?: number | null;
  isCompletedColumn?: boolean;
  position?: number;
}

export interface UpdateColumnInput {
  name?: string;
  color?: string | null;
  taskLimit?: number | null;
  isCompletedColumn?: boolean;
  position?: number;
}

export const boardService = {
  async getProjectBoards(projectId: string): Promise<Board[]> {
    return queryClient.fetchQuery({
      queryKey: ['project-boards', projectId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<Board[]>>(`/boards/project/${projectId}`);
        return response.data.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes fresh in cache
    });
  },

  async getBoard(boardId: string): Promise<Board> {
    return queryClient.fetchQuery({
      queryKey: ['board', boardId],
      queryFn: async () => {
        const response = await api.get<ApiResponse<Board>>(`/boards/${boardId}`);
        return response.data.data;
      },
      staleTime: 1000 * 30, // 30 seconds
    });
  },

  async createBoard(data: { projectId: string; name: string; description?: string }): Promise<Board> {
    const response = await api.post<ApiResponse<Board>>('/boards', data);
    queryClient.invalidateQueries({ queryKey: ['project-boards', data.projectId] });
    return response.data.data;
  },

  async updateBoard(boardId: string, data: { name?: string; description?: string }): Promise<Board> {
    const response = await api.patch<ApiResponse<Board>>(`/boards/${boardId}`, data);
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
    return response.data.data;
  },

  async deleteBoard(boardId: string): Promise<void> {
    await api.delete(`/boards/${boardId}`);
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
  },

  async createColumn(data: CreateColumnInput): Promise<BoardColumn> {
    const response = await api.post<ApiResponse<BoardColumn>>('/columns', data);
    queryClient.invalidateQueries({ queryKey: ['board', data.boardId] });
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
    return response.data.data;
  },

  async updateColumn(columnId: string, data: UpdateColumnInput): Promise<BoardColumn> {
    const response = await api.patch<ApiResponse<BoardColumn>>(`/columns/${columnId}`, data);
    queryClient.invalidateQueries({ queryKey: ['board'] });
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
    return response.data.data;
  },

  async reorderColumns(boardId: string, columns: Array<{ id: string; position: number }>): Promise<BoardColumn[]> {
    const response = await api.post<ApiResponse<BoardColumn[]>>('/columns/reorder', {
      boardId,
      columns,
    });
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
    return response.data.data;
  },

  async deleteColumn(columnId: string, targetColumnId?: string): Promise<void> {
    await api.delete(`/columns/${columnId}`, { data: { targetColumnId } });
    queryClient.invalidateQueries({ queryKey: ['board'] });
    queryClient.invalidateQueries({ queryKey: ['project-boards'] });
  },
};
