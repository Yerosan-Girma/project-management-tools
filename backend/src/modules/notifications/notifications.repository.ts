import { prisma } from '../../config/database';
import { Notification } from '@prisma/client';

export class NotificationsRepository {
  async listUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    skip: number = 0,
    take: number = 20
  ) {
    const where: any = {
      recipientId: userId
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return { total, items };
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id }
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false
      },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id }
    });
  }
}
