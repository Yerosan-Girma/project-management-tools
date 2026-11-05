import { AuthenticatedSocket } from './socket-auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { WorkspaceRole } from '../constants/roles';

export function registerRoomHandlers(socket: AuthenticatedSocket): void {
  const user = socket.user;
  if (!user) return;

  // Auto-join personal user room for direct user notifications
  const userRoom = `user:${user.id}`;
  socket.join(userRoom);
  logger.info(`🔌 Socket [${socket.id}] joined user room: ${userRoom}`);

  // Handler for joining workspace room
  socket.on('workspace:join', async (data: { workspaceId: string }, callback?: (res: any) => void) => {
    try {
      if (!data?.workspaceId) {
        callback?.({ success: false, message: 'workspaceId required' });
        return;
      }

      // Authorize: check workspace membership
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: data.workspaceId,
            userId: user.id
          }
        }
      });

      if (!member) {
        logger.warn(`🚫 Unauthorized workspace room subscription attempt: user ${user.id} -> workspace ${data.workspaceId}`);
        callback?.({ success: false, message: 'Forbidden: not a workspace member' });
        return;
      }

      const roomName = `workspace:${data.workspaceId}`;
      socket.join(roomName);
      logger.info(`🔌 Socket [${socket.id}] joined ${roomName}`);
      callback?.({ success: true, room: roomName });
    } catch (error: any) {
      logger.error(`Error joining workspace room: ${error.message}`);
      callback?.({ success: false, message: 'Internal error' });
    }
  });

  socket.on('workspace:leave', (data: { workspaceId: string }) => {
    if (data?.workspaceId) {
      const roomName = `workspace:${data.workspaceId}`;
      socket.leave(roomName);
      logger.info(`🔌 Socket [${socket.id}] left ${roomName}`);
    }
  });

  // Handler for joining project room
  socket.on('project:join', async (data: { projectId: string }, callback?: (res: any) => void) => {
    try {
      if (!data?.projectId) {
        callback?.({ success: false, message: 'projectId required' });
        return;
      }

      // Check project membership or workspace admin
      const project = await prisma.project.findUnique({
        where: { id: data.projectId, deletedAt: null },
        include: {
          members: { where: { userId: user.id } },
          workspace: {
            include: {
              members: { where: { userId: user.id } }
            }
          }
        }
      });

      if (!project) {
        callback?.({ success: false, message: 'Project not found' });
        return;
      }

      const wsMember = project.workspace.members[0];
      const isWsAdmin = wsMember && (wsMember.role === WorkspaceRole.OWNER || wsMember.role === WorkspaceRole.ADMIN);
      const isProjMember = project.members.length > 0;

      if (!isWsAdmin && !isProjMember) {
        logger.warn(`🚫 Unauthorized project room subscription attempt: user ${user.id} -> project ${data.projectId}`);
        callback?.({ success: false, message: 'Forbidden: not a project member' });
        return;
      }

      const roomName = `project:${data.projectId}`;
      socket.join(roomName);
      logger.info(`🔌 Socket [${socket.id}] joined ${roomName}`);
      callback?.({ success: true, room: roomName });
    } catch (error: any) {
      logger.error(`Error joining project room: ${error.message}`);
      callback?.({ success: false, message: 'Internal error' });
    }
  });

  socket.on('project:leave', (data: { projectId: string }) => {
    if (data?.projectId) {
      const roomName = `project:${data.projectId}`;
      socket.leave(roomName);
      logger.info(`🔌 Socket [${socket.id}] left ${roomName}`);
    }
  });
}
