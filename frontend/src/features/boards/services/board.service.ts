import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import { Board, BoardColumn } from '../../../types/board.types';

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
    const response = await api.get<ApiResponse<Board[]>>(`/boards/project/${projectId}`);
    return response.data.data;
  },

  async getBoard(boardId: string): Promise<Board> {
    const response = await api.get<ApiResponse<Board>>(`/boards/${boardId}`);
    return response.data.data;
  },

  async createBoard(data: { projectId: string; name: string; description?: string }): Promise<Board> {
    const response = await api.post<ApiResponse<Board>>('/boards', data);
    return response.data.data;
  },

  async updateBoard(boardId: string, data: { name?: string; description?: string }): Promise<Board> {
    const response = await api.patch<ApiResponse<Board>>(`/boards/${boardId}`, data);
    return response.data.data;
  },

  async deleteBoard(boardId: string): Promise<void> {
    await api.delete(`/boards/${boardId}`);
  },

  async createColumn(data: CreateColumnInput): Promise<BoardColumn> {
    const response = await api.post<ApiResponse<BoardColumn>>('/columns', data);
    return response.data.data;
  },

  async updateColumn(columnId: string, data: UpdateColumnInput): Promise<BoardColumn> {
    const response = await api.patch<ApiResponse<BoardColumn>>(`/columns/${columnId}`, data);
    return response.data.data;
  },

  async reorderColumns(boardId: string, columns: Array<{ id: string; position: number }>): Promise<BoardColumn[]> {
    const response = await api.post<ApiResponse<BoardColumn[]>>('/columns/reorder', {
      boardId,
      columns,
    });
    return response.data.data;
  },

  async deleteColumn(columnId: string, targetColumnId?: string): Promise<void> {
    await api.delete(`/columns/${columnId}`, { data: { targetColumnId } });
  },
};
