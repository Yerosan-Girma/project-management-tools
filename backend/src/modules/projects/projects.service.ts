import { ProjectsRepository } from './projects.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { ProjectRole, WorkspaceRole } from '../../constants/roles';
import { ProjectStatus, PriorityLevel, NotificationType } from '../../constants/status';
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
  UpdateProjectMemberRoleInput
} from './projects.schema';

export class ProjectsService {
  constructor(private readonly projectsRepo: ProjectsRepository = new ProjectsRepository()) {}

  async createProject(userId: string, input: CreateProjectInput) {
    // 1. Verify workspace exists and user has ADMIN or OWNER role in workspace
    const wsMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId
        }
      }
    });

    if (!wsMember || (wsMember.role !== WorkspaceRole.OWNER && wsMember.role !== WorkspaceRole.ADMIN)) {
      throw AppError.forbidden('Only workspace Owners and Admins can create projects.');
    }

    // 2. Check if project key is already taken in this workspace
    const existing = await this.projectsRepo.findByKey(input.workspaceId, input.key);
    if (existing) {
      throw AppError.conflict(`Project key '${input.key}' is already in use in this workspace.`);
    }

    const project = await this.projectsRepo.createProjectWithDefaultBoardAndColumns({
      workspaceId: input.workspaceId,
      name: input.name,
      key: input.key,
      description: input.description,
      priority: input.priority as PriorityLevel,
      startDate: input.startDate ? new Date(input.startDate) : null,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      createdById: userId
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: input.workspaceId,
        projectId: project.id,
        resourceType: 'project',
        resourceId: project.id,
        action: 'PROJECT_CREATED',
        metadata: { name: project.name, key: project.key }
      }
    });

    return project;
  }

  async listWorkspaceProjects(
    workspaceId: string,
    userId: string,
    status?: ProjectStatus,
    priority?: PriorityLevel
  ) {
    const wsMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    if (!wsMember) {
      throw AppError.forbidden('You do not belong to this workspace.');
    }

    const isGuest = wsMember.role === WorkspaceRole.GUEST;

    return this.projectsRepo.listWorkspaceProjects(
      workspaceId,
      userId,
      isGuest,
      status,
      priority
    );
  }

  async getProjectDetails(projectId: string, userId: string) {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    const updated = await this.projectsRepo.updateProject(projectId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status as ProjectStatus }),
      ...(input.priority !== undefined && { priority: input.priority as PriorityLevel }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null
      }),
      ...(input.targetDate !== undefined && {
        targetDate: input.targetDate ? new Date(input.targetDate) : null
      })
    });

    // Record activity
    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        resourceType: 'project',
        resourceId: project.id,
        action: 'PROJECT_UPDATED',
        metadata: input
      }
    });

    return updated;
  }

  async archiveProject(projectId: string, userId: string) {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    const archived = await this.projectsRepo.archiveProject(projectId);

    await prisma.activityLog.create({
      data: {
        actorId: userId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        resourceType: 'project',
        resourceId: project.id,
        action: 'PROJECT_ARCHIVED',
        metadata: { name: project.name }
      }
    });

    return archived;
  }

  // Members
  async addProjectMember(projectId: string, operatorUserId: string, input: AddProjectMemberInput) {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    // Target user must belong to workspace first
    const wsMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId: input.userId
        }
      }
    });
    if (!wsMember) {
      throw AppError.badRequest('User must be a member of the workspace before being added to a project.');
    }

    const existing = await this.projectsRepo.findMember(projectId, input.userId);
    if (existing) {
      throw AppError.conflict('User is already a member of this project.');
    }

    const member = await this.projectsRepo.addMember(projectId, input.userId, input.role as ProjectRole);

    // Notify user
    await prisma.notification.create({
      data: {
        recipientId: input.userId,
        type: NotificationType.PROJECT_MEMBER_ADDED,
        title: 'Added to Project',
        message: `You were added to project "${project.name}" as ${input.role}.`,
        resourceType: 'project',
        resourceId: project.id
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        actorId: operatorUserId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        resourceType: 'project',
        resourceId: project.id,
        action: 'PROJECT_MEMBER_ADDED',
        metadata: { userId: input.userId, role: input.role }
      }
    });

    return member;
  }

  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    operatorUserId: string,
    input: UpdateProjectMemberRoleInput
  ) {
    const member = await this.projectsRepo.findMember(projectId, targetUserId);
    if (!member) {
      throw AppError.notFound('Project member not found.');
    }

    if (operatorUserId === targetUserId) {
      throw AppError.forbidden('You cannot change your own project role.');
    }

    // Prevent demoting the last manager
    if (member.role === ProjectRole.MANAGER && input.role !== ProjectRole.MANAGER) {
      const managerCount = await prisma.projectMember.count({
        where: { projectId, role: ProjectRole.MANAGER }
      });
      if (managerCount <= 1) {
        throw AppError.badRequest('Cannot demote the last project manager.');
      }
    }

    const previousRole = member.role;
    const updated = await this.projectsRepo.updateMemberRole(projectId, targetUserId, input.role as ProjectRole);

    const project = await this.projectsRepo.findById(projectId);
    if (project) {
      await prisma.activityLog.create({
        data: {
          actorId: operatorUserId,
          workspaceId: project.workspaceId,
          projectId: project.id,
          resourceType: 'project_member_role',
          resourceId: targetUserId,
          action: 'PROJECT_MEMBER_ROLE_UPDATED',
          metadata: {
            previousRole,
            newRole: input.role,
            targetUserId
          }
        }
      });
    }

    return updated;
  }

  async removeProjectMember(projectId: string, targetUserId: string, operatorUserId: string) {
    const member = await this.projectsRepo.findMember(projectId, targetUserId);
    if (!member) {
      throw AppError.notFound('Project member not found.');
    }

    if (member.role === ProjectRole.MANAGER) {
      const managerCount = await prisma.projectMember.count({
        where: { projectId, role: ProjectRole.MANAGER }
      });
      if (managerCount <= 1) {
        throw AppError.badRequest('Cannot remove the last project manager from the project.');
      }
    }

    await this.projectsRepo.removeMember(projectId, targetUserId);

    const project = await this.projectsRepo.findById(projectId);
    if (project) {
      await prisma.notification.create({
        data: {
          recipientId: targetUserId,
          type: NotificationType.PROJECT_MEMBER_REMOVED,
          title: 'Removed from Project',
          message: `You were removed from project "${project.name}".`,
          resourceType: 'project',
          resourceId: project.id
        }
      });

      await prisma.activityLog.create({
        data: {
          actorId: operatorUserId,
          workspaceId: project.workspaceId,
          projectId: project.id,
          resourceType: 'project_member',
          resourceId: targetUserId,
          action: 'PROJECT_MEMBER_REMOVED',
          metadata: { removedUserId: targetUserId }
        }
      });
    }

    return true;
  }

  async getProjectActivity(projectId: string) {
    return this.projectsRepo.getProjectActivity(projectId);
  }

  async getProjectOverview(projectId: string) {
    const project = await this.projectsRepo.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    // Query task counts by column
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
        isArchived: false
      },
      include: {
        column: { select: { id: true, name: true, isCompletedColumn: true } },
        assignees: { select: { userId: true } }
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.column.isCompletedColumn).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(
      (t) => !t.column.isCompletedColumn && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    // Tasks grouped by column
    const columnStats: Record<string, { columnId: string; name: string; count: number; isCompleted: boolean }> = {};
    for (const task of tasks) {
      if (!columnStats[task.column.id]) {
        columnStats[task.column.id] = {
          columnId: task.column.id,
          name: task.column.name,
          count: 0,
          isCompleted: task.column.isCompletedColumn
        };
      }
      columnStats[task.column.id].count += 1;
    }

    return {
      projectId: project.id,
      name: project.name,
      key: project.key,
      status: project.status,
      priority: project.priority,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      columns: Object.values(columnStats),
      memberCount: project.members.length
    };
  }
}
