import { api } from '../../../services/api';
import { ApiResponse, PaginatedResult } from '../../../types/api.types';
import { Notification } from '../../../types/notification.types';

export const notificationService = {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<PaginatedResult<Notification>> {
    const response = await api.get<ApiResponse<PaginatedResult<Notification>>>('/notifications', {
      params,
    });
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count'
    );
    return response.data.data.unreadCount;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
    );
    return response.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },
};
