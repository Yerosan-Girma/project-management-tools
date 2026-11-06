import { io, Socket } from 'socket.io-client';
import { queryClient } from '../app/query-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private currentWorkspaceId: string | null = null;
  private currentProjectId: string | null = null;

  init(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Re-join active rooms on reconnect
      if (this.currentWorkspaceId) {
        this.joinWorkspace(this.currentWorkspaceId);
      }
      if (this.currentProjectId) {
        this.joinProject(this.currentProjectId);
      }
    });

    // Invalidate TanStack query cache on real-time task mutations
    this.socket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    });

    this.socket.on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    this.socket.on('task:moved', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    this.socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    // Invalidate comments
    this.socket.on('comment:created', () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    });

    // Invalidate notifications
    this.socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    });

    // Invalidate project
    this.socket.on('project:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    });
  }

  joinWorkspace(workspaceId: string) {
    this.currentWorkspaceId = workspaceId;
    if (this.socket?.connected) {
      this.socket.emit('workspace:join', { workspaceId });
    }
  }

  leaveWorkspace(workspaceId: string) {
    if (this.currentWorkspaceId === workspaceId) {
      this.currentWorkspaceId = null;
    }
    if (this.socket?.connected) {
      this.socket.emit('workspace:leave', { workspaceId });
    }
  }

  joinProject(projectId: string) {
    this.currentProjectId = projectId;
    if (this.socket?.connected) {
      this.socket.emit('project:join', { projectId });
    }
  }

  leaveProject(projectId: string) {
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }
    if (this.socket?.connected) {
      this.socket.emit('project:leave', { projectId });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentWorkspaceId = null;
    this.currentProjectId = null;
  }
}

export const socketService = new SocketService();
export default socketService;
