import { prisma } from '../../config/database';
import { Task, PriorityLevel } from '@prisma/client';
import { TaskQueryInput } from './tasks.schema';

export class TasksRepository {
  async createTask(data: {
    projectId: string;
    boardColumnId: string;
    title: string;
    description?: string;
    priority: PriorityLevel;
    position: number;
    dueDate?: Date | null;
    startDate?: Date | null;
    createdById: string;
    assigneeIds?: string[];
    labelIds?: string[];
  }): Promise<Task> {
    return prisma.$transaction(async (tx) => {
      // 1. Create Task
      const task = await tx.task.create({
        data: {
          projectId: data.projectId,
          boardColumnId: data.boardColumnId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          position: data.position,
          dueDate: data.dueDate,
          startDate: data.startDate,
          createdById: data.createdById,
          assignees: data.assigneeIds && data.assigneeIds.length > 0
            ? {
                create: data.assigneeIds.map((userId) => ({
                  userId,
                  assignedById: data.createdById
                }))
              }
            : undefined,
          labels: data.labelIds && data.labelIds.length > 0
            ? {
                create: data.labelIds.map((labelId) => ({
                  labelId
                }))
              }
            : undefined
        },
        include: {
          column: true,
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
          },
          labels: {
            include: { label: true }
          },
          creator: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        }
      });

      return task;
    });
  }

  async findById(id: string) {
    return prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        column: {
          include: {
            board: {
              select: { id: true, name: true, projectId: true }
            }
          }
        },
        project: {
          select: { id: true, workspaceId: true, name: true, key: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        labels: {
          include: { label: true }
        },
        attachments: true,
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, title: true, priority: true } }
          }
        },
        dependentOn: {
          include: {
            task: { select: { id: true, title: true, priority: true } }
          }
        },
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            attachments: true
          }
        }
      }
    });
  }

  async listProjectTasks(projectId: string, filters: TaskQueryInput, skip: number = 0, take: number = 50) {
    const where: any = {
      projectId,
      deletedAt: null,
      isArchived: filters.isArchived ?? false
    };

    if (filters.boardColumnId) {
      where.boardColumnId = filters.boardColumnId;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.assigneeId) {
      where.assignees = {
        some: { userId: filters.assigneeId }
      };
    }
    if (filters.labelId) {
      where.labels = {
        some: { labelId: filters.labelId }
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          column: true,
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
          },
          labels: {
            include: { label: true }
          },
          creator: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          },
          _count: {
            select: { comments: { where: { deletedAt: null } }, attachments: true }
          }
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take
      })
    ]);

    return { total, items };
  }

  async listMyAssignedTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        assignees: {
          some: { userId }
        }
      },
      include: {
        project: {
          select: { id: true, name: true, key: true, workspaceId: true }
        },
        column: {
          select: { id: true, name: true, color: true, isCompletedColumn: true }
        },
        labels: {
          include: { label: true }
        }
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }]
    });
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        column: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        labels: {
          include: { label: true }
        }
      }
    });
  }

  async moveTask(
    taskId: string,
    destinationColumnId: string,
    newPosition: number,
    isCompletedColumn: boolean
  ): Promise<Task> {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        boardColumnId: destinationColumnId,
        position: newPosition,
        completedAt: isCompletedColumn ? new Date() : null
      },
      include: {
        column: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        }
      }
    });
  }

  async addAssignees(taskId: string, userIds: string[], assignedById: string) {
    return prisma.$transaction(
      userIds.map((userId) =>
        prisma.taskAssignee.upsert({
          where: { taskId_userId: { taskId, userId } },
          create: { taskId, userId, assignedById },
          update: {}
        })
      )
    );
  }

  async removeAssignee(taskId: string, userId: string) {
    return prisma.taskAssignee.delete({
      where: { taskId_userId: { taskId, userId } }
    });
  }

  async setTaskLabels(taskId: string, labelIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.taskLabel.deleteMany({ where: { taskId } });
      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId) => ({ taskId, labelId }))
        });
      }
    });
  }
}
