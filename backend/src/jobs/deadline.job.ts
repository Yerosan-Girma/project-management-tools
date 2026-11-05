import { prisma } from '../config/database';
import { NotificationType } from '../constants/status';
import { NotificationJob } from './notification.job';
import { logger } from '../utils/logger';

export class DeadlineJob {
  // Check tasks due within 24 hours
  static async checkUpcomingDeadlines(): Promise<number> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        completedAt: null,
        dueDate: {
          gt: now,
          lte: in24Hours
        }
      },
      include: {
        assignees: true,
        project: { select: { name: true } }
      }
    });

    let sent = 0;
    for (const task of upcomingTasks) {
      for (const assignee of task.assignees) {
        // Prevent duplicate notification in the last 24h
        const recentNotif = await prisma.notification.findFirst({
          where: {
            recipientId: assignee.userId,
            type: NotificationType.DEADLINE_UPCOMING,
            resourceId: task.id,
            createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          }
        });

        if (!recentNotif) {
          await NotificationJob.createAndDispatch({
            recipientId: assignee.userId,
            type: NotificationType.DEADLINE_UPCOMING,
            title: 'Upcoming Deadline Alert',
            message: `Task "${task.title}" in ${task.project.name} is due within 24 hours.`,
            resourceType: 'task',
            resourceId: task.id
          });
          sent++;
        }
      }
    }

    logger.info(`⏰ Deadline checker dispatched ${sent} upcoming deadline notifications.`);
    return sent;
  }

  // Check overdue tasks
  static async checkOverdueTasks(): Promise<number> {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        completedAt: null,
        dueDate: {
          lt: now
        }
      },
      include: {
        assignees: true,
        project: { select: { name: true } }
      }
    });

    let sent = 0;
    for (const task of overdueTasks) {
      for (const assignee of task.assignees) {
        const recentNotif = await prisma.notification.findFirst({
          where: {
            recipientId: assignee.userId,
            type: NotificationType.DEADLINE_OVERDUE,
            resourceId: task.id,
            createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          }
        });

        if (!recentNotif) {
          await NotificationJob.createAndDispatch({
            recipientId: assignee.userId,
            type: NotificationType.DEADLINE_OVERDUE,
            title: 'Task Overdue Alert',
            message: `Task "${task.title}" in ${task.project.name} is now overdue.`,
            resourceType: 'task',
            resourceId: task.id
          });
          sent++;
        }
      }
    }

    logger.info(`⏰ Deadline checker dispatched ${sent} overdue task notifications.`);
    return sent;
  }

  // Start periodic background scheduler
  static startScheduler(intervalMinutes: number = 60): NodeJS.Timeout {
    logger.info(`⏰ Deadline background scheduler initialized (interval: ${intervalMinutes} min).`);
    // Run initial scan
    DeadlineJob.checkUpcomingDeadlines().catch((e) => logger.error(`Deadline check error: ${e.message}`));

    return setInterval(() => {
      DeadlineJob.checkUpcomingDeadlines().catch((e) => logger.error(`Deadline check error: ${e.message}`));
      DeadlineJob.checkOverdueTasks().catch((e) => logger.error(`Overdue check error: ${e.message}`));
    }, intervalMinutes * 60 * 1000);
  }
}
