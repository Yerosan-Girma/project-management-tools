export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UNASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DEADLINE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'COMMENT_MENTION'
  | 'TASK_COMMENT_ADDED'
  | 'TASK_MENTIONED'
  | 'WORKSPACE_INVITATION'
  | 'WORKSPACE_MEMBER_JOINED'
  | 'WORKSPACE_MEMBER_REMOVED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
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
