import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { ApiResponse } from '../../utils/api-response';
import { parsePagination, formatPaginatedResponse } from '../../utils/pagination';

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService = new NotificationsService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const unreadOnly = req.query.unread === 'true';

    const { total, items } = await this.notificationsService.listNotifications(
      req.user!.id,
      unreadOnly,
      pagination.skip,
      pagination.limit
    );

    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Notifications retrieved.', formatted);
  };

  unreadCount = async (req: Request, res: Response): Promise<void> => {
    const result = await this.notificationsService.getUnreadCount(req.user!.id);
    ApiResponse.success(res, 'Unread notification count retrieved.', result);
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const notification = await this.notificationsService.markAsRead(req.params.id, req.user!.id);
    ApiResponse.success(res, 'Notification marked as read.', notification);
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    await this.notificationsService.markAllAsRead(req.user!.id);
    ApiResponse.success(res, 'All notifications marked as read.');
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.notificationsService.deleteNotification(req.params.id, req.user!.id);
    ApiResponse.success(res, 'Notification removed.');
  };
}
