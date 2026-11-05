import { CommentsRepository } from './comments.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { NotificationType } from '../../constants/status';
import { WorkspaceRole, ProjectRole } from '../../constants/roles';
import { CreateCommentInput, UpdateCommentInput } from './comments.schema';

export class CommentsService {
  constructor(private readonly commentsRepo: CommentsRepository = new CommentsRepository()) {}

  async createComment(taskId: string, userId: string, input: CreateCommentInput) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: {
        project: {
          include: {
            members: { select: { userId: true } }
          }
        },
        assignees: { select: { userId: true } }
      }
    });

    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    // Verify user is a member of this project or workspace admin
    const isProjectMember = task.project.members.some((m) => m.userId === userId);
    if (!isProjectMember) {
      // Check workspace admin/owner
      const wsMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: task.project.workspaceId,
            userId
          }
        }
      });
      if (!wsMember || (wsMember.role !== WorkspaceRole.OWNER && wsMember.role !== WorkspaceRole.ADMIN)) {
        throw AppError.forbidden('You do not have access to comment on this project task.');
      }
    }

    // If parentId is specified, verify it belongs to this task
    let parentAuthorId: string | null = null;
    if (input.parentId) {
      const parent = await this.commentsRepo.findById(input.parentId);
      if (!parent || parent.taskId !== taskId) {
        throw AppError.badRequest('Parent comment does not belong to this task.');
      }
      parentAuthorId = parent.authorId;
    }

    const comment = await this.commentsRepo.createComment({
      taskId,
      authorId: userId,
      content: input.content,
      parentId: input.parentId
    });

    // Record Activity
    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_COMMENT_ADDED',
        metadata: { commentId: comment.id, isReply: !!input.parentId }
      }
    });

    // Notify assignees & parent author
    const recipientsToNotify = new Set<string>();
    task.assignees.forEach((a) => recipientsToNotify.add(a.userId));
    if (task.createdById !== userId) recipientsToNotify.add(task.createdById);
    if (parentAuthorId && parentAuthorId !== userId) recipientsToNotify.add(parentAuthorId);
    recipientsToNotify.delete(userId); // Don't notify self

    for (const recipientId of recipientsToNotify) {
      await prisma.notification.create({
        data: {
          recipientId,
          type: NotificationType.TASK_COMMENT_ADDED,
          title: 'New Comment on Task',
          message: `New comment added to "${task.title}": "${input.content.slice(0, 100)}${input.content.length > 100 ? '...' : ''}"`,
          resourceType: 'task',
          resourceId: task.id
        }
      });
    }

    return comment;
  }

  async listTaskComments(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null }
    });
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    return this.commentsRepo.listTaskComments(taskId);
  }

  async updateComment(commentId: string, userId: string, input: UpdateCommentInput) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw AppError.notFound('Comment not found.');
    }

    if (comment.authorId !== userId) {
      throw AppError.forbidden('You can only edit your own comments.');
    }

    return this.commentsRepo.updateComment(commentId, input.content);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment) {
      throw AppError.notFound('Comment not found.');
    }

    // Author can delete, or project MANAGER, or workspace ADMIN/OWNER
    const isAuthor = comment.authorId === userId;
    if (!isAuthor) {
      const projMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: comment.task.projectId,
            userId
          }
        }
      });

      const wsMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: comment.task.project.workspaceId,
            userId
          }
        }
      });

      const isManager = projMember?.role === ProjectRole.MANAGER;
      const isWsAdmin = wsMember?.role === WorkspaceRole.ADMIN || wsMember?.role === WorkspaceRole.OWNER;

      if (!isManager && !isWsAdmin) {
        throw AppError.forbidden('You do not have permission to delete this comment.');
      }
    }

    await this.commentsRepo.softDeleteComment(commentId);
    return true;
  }
}
