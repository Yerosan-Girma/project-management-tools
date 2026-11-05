import { NotificationsRepository } from './notifications.repository';
import { AppError } from '../../utils/app-error';

export class NotificationsService {
  constructor(private readonly notificationsRepo: NotificationsRepository = new NotificationsRepository()) {}

  async listNotifications(userId: string, unreadOnly: boolean = false, skip: number = 0, take: number = 20) {
    return this.notificationsRepo.listUserNotifications(userId, unreadOnly, skip, take);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepo.countUnread(userId);
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationsRepo.findById(notificationId);
    if (!notification) {
      throw AppError.notFound('Notification not found.');
    }

    if (notification.recipientId !== userId) {
      throw AppError.forbidden('You do not have access to this notification.');
    }

    return this.notificationsRepo.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepo.markAllAsRead(userId);
    return true;
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.notificationsRepo.findById(notificationId);
    if (!notification) {
      throw AppError.notFound('Notification not found.');
    }

    if (notification.recipientId !== userId) {
      throw AppError.forbidden('You do not have access to this notification.');
    }

    await this.notificationsRepo.deleteNotification(notificationId);
    return true;
  }
}
