export const SocketEvents = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',

  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_MOVED: 'task:moved',
  TASK_ASSIGNED: 'task:assigned',
  TASK_DELETED: 'task:deleted',

  // Board & Column events
  COLUMN_CREATED: 'column:created',
  COLUMN_UPDATED: 'column:updated',
  COLUMN_REORDERED: 'column:reordered',
  COLUMN_DELETED: 'column:deleted',

  // Project events
  PROJECT_UPDATED: 'project:updated',

  // Comment events
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',

  // Workspace / Member events
  MEMBER_JOINED: 'member:joined',
  MEMBER_REMOVED: 'member:removed',
  MEMBER_ROLE_UPDATED: 'member:role_updated',

  // Notification events
  NOTIFICATION_NEW: 'notification:new'
} as const;
