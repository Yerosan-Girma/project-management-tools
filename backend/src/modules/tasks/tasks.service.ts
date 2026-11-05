import { TasksRepository } from './tasks.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { PriorityLevel, NotificationType } from '../../constants/status';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  AssignUsersInput,
  TaskLabelsInput,
  TaskQueryInput
} from './tasks.schema';

export class TasksService {
  constructor(private readonly tasksRepo: TasksRepository = new TasksRepository()) {}

  async createTask(userId: string, input: CreateTaskInput) {
    // 1. Validate project and column existence
    const project = await prisma.project.findUnique({
      where: { id: input.projectId, deletedAt: null },
      include: {
        members: { select: { userId: true } }
      }
    });

    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    const column = await prisma.boardColumn.findUnique({
      where: { id: input.boardColumnId },
      include: { board: true }
    });

    if (!column || column.board.projectId !== input.projectId) {
      throw AppError.badRequest('Destination column does not belong to this project.');
    }

    // 2. Validate assignees are project members
    if (input.assigneeIds && input.assigneeIds.length > 0) {
      const projectMemberIds = new Set(project.members.map((m) => m.userId));
      for (const aId of input.assigneeIds) {
        if (!projectMemberIds.has(aId)) {
          throw AppError.badRequest(`User ${aId} is not a member of this project.`);
        }
      }
    }

    // 3. Determine task position
    let position = input.position;
    if (position === undefined) {
      const count = await prisma.task.count({
        where: { boardColumnId: input.boardColumnId, deletedAt: null }
      });
      position = (count + 1) * 1000;
    }

    const task = await this.tasksRepo.createTask({
      projectId: input.projectId,
      boardColumnId: input.boardColumnId,
      title: input.title,
      description: input.description,
      priority: input.priority as PriorityLevel,
      position,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      createdById: userId,
      assigneeIds: input.assigneeIds,
      labelIds: input.labelIds
    });

    // 4. Create Activity Log
    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_CREATED',
        metadata: { title: task.title, columnId: input.boardColumnId }
      }
    });

    // 5. Send notifications to assignees (excluding creator)
    if (input.assigneeIds) {
      for (const assigneeId of input.assigneeIds) {
        if (assigneeId !== userId) {
          await prisma.notification.create({
            data: {
              recipientId: assigneeId,
              type: NotificationType.TASK_ASSIGNED,
              title: 'New Task Assignment',
              message: `You were assigned to "${task.title}".`,
              resourceType: 'task',
              resourceId: task.id
            }
          });
        }
      }
    }

    return task;
  }

  async getTaskDetails(taskId: string) {
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }
    return task;
  }

  async listProjectTasks(projectId: string, filters: TaskQueryInput, skip: number = 0, take: number = 50) {
    return this.tasksRepo.listProjectTasks(projectId, filters, skip, take);
  }

  async listMyAssignedTasks(userId: string) {
    return this.tasksRepo.listMyAssignedTasks(userId);
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    const updated = await this.tasksRepo.updateTask(taskId, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority !== undefined && { priority: input.priority as PriorityLevel }),
      ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null
      }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null
      })
    });

    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_UPDATED',
        metadata: input
      }
    });

    return updated;
  }

  async moveTask(taskId: string, userId: string, input: MoveTaskInput) {
    // 1. Fetch task
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    // 2. Fetch destination column
    const destColumn = await prisma.boardColumn.findUnique({
      where: { id: input.destinationColumnId },
      include: { board: true }
    });

    if (!destColumn) {
      throw AppError.notFound('Destination column not found.');
    }

    // 3. Strict verification: destination column must belong to the SAME project!
    if (destColumn.board.projectId !== task.projectId) {
      throw AppError.badRequest('Destination column must belong to the same project as the task.');
    }

    const oldColumnId = task.boardColumnId;
    const moved = await this.tasksRepo.moveTask(
      taskId,
      input.destinationColumnId,
      input.newPosition,
      destColumn.isCompletedColumn
    );

    // 4. Record Activity
    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_MOVED',
        metadata: {
          fromColumnId: oldColumnId,
          toColumnId: input.destinationColumnId,
          newPosition: input.newPosition,
          isCompleted: destColumn.isCompletedColumn
        }
      }
    });

    return moved;
  }

  async assignUsers(taskId: string, operatorUserId: string, input: AssignUsersInput) {
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    // Check project membership of target users
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: task.projectId },
      select: { userId: true }
    });
    const allowedUserIds = new Set(projectMembers.map((m) => m.userId));

    for (const uId of input.userIds) {
      if (!allowedUserIds.has(uId)) {
        throw AppError.badRequest(`User ${uId} is not a member of project "${task.project.name}".`);
      }
    }

    await this.tasksRepo.addAssignees(taskId, input.userIds, operatorUserId);

    // Notifications & Activity
    for (const uId of input.userIds) {
      if (uId !== operatorUserId) {
        await prisma.notification.create({
          data: {
            recipientId: uId,
            type: NotificationType.TASK_ASSIGNED,
            title: 'Task Assigned',
            message: `You were assigned to "${task.title}".`,
            resourceType: 'task',
            resourceId: task.id
          }
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        actorId: operatorUserId,
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_ASSIGNED',
        metadata: { userIds: input.userIds }
      }
    });

    return this.getTaskDetails(taskId);
  }

  async unassignUser(taskId: string, targetUserId: string, operatorUserId: string) {
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    await this.tasksRepo.removeAssignee(taskId, targetUserId);

    await prisma.activityLog.create({
      data: {
        actorId: operatorUserId,
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        resourceType: 'task',
        resourceId: task.id,
        action: 'TASK_UNASSIGNED',
        metadata: { userId: targetUserId }
      }
    });

    return true;
  }

  async setTaskLabels(taskId: string, input: TaskLabelsInput) {
    const task = await this.tasksRepo.findById(taskId);
    if (!task) {
      throw AppError.notFound('Task not found.');
    }

    await this.tasksRepo.setTaskLabels(taskId, input.labelIds);
    return this.getTaskDetails(taskId);
  }

  async archiveTask(taskId: string, userId: string) {
    return this.updateTask(taskId, userId, { isArchived: true });
  }
}
