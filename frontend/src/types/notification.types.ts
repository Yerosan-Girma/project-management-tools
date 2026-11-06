export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_DEADLINE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'COMMENT_MENTION'
  | 'WORKSPACE_INVITATION'
  | 'PROJECT_ADDED'
  | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
  isRead: boolean;
  createdAt: string;
}
