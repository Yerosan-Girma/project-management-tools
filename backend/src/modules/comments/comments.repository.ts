import { prisma } from '../../config/database';
import { Comment } from '@prisma/client';

export class CommentsRepository {
  async createComment(data: {
    taskId: string;
    authorId: string;
    content: string;
    parentId?: string;
  }): Promise<Comment> {
    return prisma.comment.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.comment.findFirst({
      where: { id, deletedAt: null },
      include: {
        task: {
          include: {
            project: { select: { id: true, workspaceId: true } }
          }
        },
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  }

  async listTaskComments(taskId: string) {
    return prisma.comment.findMany({
      where: {
        taskId,
        deletedAt: null
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    return prisma.comment.update({
      where: { id },
      data: {
        content,
        isEdited: true
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  }

  async softDeleteComment(id: string): Promise<void> {
    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
