import { prisma } from '../config/database';
import { emitToUser } from '../sockets';
import { SocketEvents } from '../constants/events';
import { NotificationType } from '../constants/status';
import { logger } from '../utils/logger';

export interface CreateNotificationJobInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
}

export class NotificationJob {
  static async createAndDispatch(input: CreateNotificationJobInput) {
    try {
      // 1. Persist notification in PostgreSQL
      const notification = await prisma.notification.create({
        data: input
      });

      // 2. Dispatch real-time Socket.IO event to user room
      emitToUser(input.recipientId, SocketEvents.NOTIFICATION_NEW, notification);

      return notification;
    } catch (error: any) {
      logger.error(`❌ Failed to dispatch notification: ${error.message}`);
      return null;
    }
  }

  // Cleanup old read notifications older than 30 days
  static async purgeOldNotifications(days: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoff }
      }
    });
    logger.info(`🧹 Cleaned up ${result.count} old notifications.`);
    return result.count;
  }
}
