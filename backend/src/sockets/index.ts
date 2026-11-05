import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, isRedisConnected } from '../config/redis';
import { socketAuthMiddleware, AuthenticatedSocket } from './socket-auth';
import { registerRoomHandlers } from './socket-rooms';
import { SocketEvents } from './socket-events';
import { logger } from '../utils/logger';
import { corsOptions } from '../config/cors';

let ioInstance: SocketIOServer | null = null;

export function initializeSockets(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Setup Redis adapter if configured and connected
  const redis = getRedisClient();
  if (redis && isRedisConnected()) {
    try {
      const subClient = redis.duplicate();
      io.adapter(createAdapter(redis, subClient));
      logger.info('⚡ Socket.IO Redis adapter enabled for multi-instance scaling.');
    } catch (err: any) {
      logger.warn(`⚠️ Failed to bind Socket.IO Redis adapter: ${err.message}. Using default in-memory adapter.`);
    }
  } else {
    logger.info('ℹ️ Socket.IO using default in-memory adapter.');
  }

  // Socket Authentication Middleware
  io.use(socketAuthMiddleware);

  // Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`🔌 Authenticated socket connected: id=${socket.id}, user=${socket.user?.email} (${socket.user?.id})`);

    // Register room handlers
    registerRoomHandlers(socket);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: id=${socket.id}, reason=${reason}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

// Helper methods for broadcasting events to authorized rooms
export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
}

export function emitToWorkspace(workspaceId: string, event: string, payload: unknown): void {
  if (ioInstance) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}

export function emitToProject(projectId: string, event: string, payload: unknown): void {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit(event, payload);
  }
}

export { SocketEvents };
