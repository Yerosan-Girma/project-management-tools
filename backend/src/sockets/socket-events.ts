import { SocketEvents } from '../constants/events';

export interface TaskCreatedPayload {
  taskId: string;
  projectId: string;
  columnId: string;
  title: string;
  createdById: string;
}

export interface TaskUpdatedPayload {
  taskId: string;
  projectId: string;
  updates: Record<string, unknown>;
}

export interface TaskMovedPayload {
  taskId: string;
  projectId: string;
  fromColumnId: string;
  toColumnId: string;
  newPosition: number;
}

export interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  userIds: string[];
}

export interface TaskDeletedPayload {
  taskId: string;
  projectId: string;
}

export interface CommentCreatedPayload {
  commentId: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
}

export interface ProjectUpdatedPayload {
  projectId: string;
  workspaceId: string;
  updates: Record<string, unknown>;
}

export interface NotificationNewPayload {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
}

export interface MemberJoinedPayload {
  workspaceId: string;
  userId: string;
  role: string;
}

export interface MemberRemovedPayload {
  workspaceId: string;
  userId: string;
}

export { SocketEvents };
