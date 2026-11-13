import { api } from '../../../services/api';
import { ApiResponse, PaginatedResult } from '../../../types/api.types';
import { Notification } from '../../../types/notification.types';
import { queryClient } from '../../../app/query-client';

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
    return queryClient.fetchQuery({
      queryKey: ['unread-notifications-count'],
      queryFn: async () => {
        const response = await api.get<ApiResponse<{ unreadCount: number }>>(
          '/notifications/unread-count'
        );
        return response.data.data.unreadCount;
      },
      staleTime: 1000 * 15, // 15 seconds
    });
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
    );
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    return response.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
  },
};
