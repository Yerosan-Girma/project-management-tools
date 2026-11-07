import { prisma } from '../../config/database';
import { ProjectStatus, WorkspaceRole } from '@prisma/client';

export class AnalyticsRepository {
  async getUserDashboardStats(userId: string, workspaceId?: string) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Total workspaces user belongs to
    const workspacesCount = await prisma.workspaceMember.count({
      where: { userId, workspace: { deletedAt: null, isArchived: false } }
    });

    // Check user platform role & workspace membership if workspaceId is provided
    let userWorkspaceRole: string | null = null;
    let isWorkspaceAdminOrOwner = false;

    if (workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (membership) {
        userWorkspaceRole = membership.role;
        isWorkspaceAdminOrOwner =
          membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN;
      }
    }

    // 2. User accessible projects
    const projectWhere: any = {
      deletedAt: null,
      isArchived: false
    };

    if (workspaceId) {
      projectWhere.workspaceId = workspaceId;
      if (!isWorkspaceAdminOrOwner) {
        projectWhere.members = { some: { userId } };
      }
    } else {
      projectWhere.members = { some: { userId } };
    }

    const userProjects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true, status: true, priority: true }
    });

    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
    const projectIds = userProjects.map((p) => p.id);

    // 3. User assigned tasks
    const taskWhere: any = {
      deletedAt: null,
      isArchived: false,
      assignees: { some: { userId } }
    };
    if (workspaceId) {
      taskWhere.project = { workspaceId, deletedAt: null, isArchived: false };
    } else if (projectIds.length > 0) {
      taskWhere.projectId = { in: projectIds };
    }

    const userAssignedTasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        column: { select: { isCompletedColumn: true } }
      }
    });

    const totalAssignedTasks = userAssignedTasks.length;
    const completedTasks = userAssignedTasks.filter((t) => t.column.isCompletedColumn).length;
    const pendingTasks = totalAssignedTasks - completedTasks;

    const overdueTasks = userAssignedTasks.filter(
      (t) => !t.column.isCompletedColumn && t.dueDate && t.dueDate < now
    ).length;

    const upcomingDeadlines = userAssignedTasks.filter(
      (t) => !t.column.isCompletedColumn && t.dueDate && t.dueDate >= now && t.dueDate <= tomorrow
    ).length;

    // Priority breakdown of assigned tasks
    const priorityDistribution: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };
    for (const t of userAssignedTasks) {
      if (priorityDistribution[t.priority] !== undefined) {
        priorityDistribution[t.priority]++;
      }
    }

    // Team stats for the active workspace (or all accessible projects)
    const teamTasksWhere: any = {
      deletedAt: null,
      isArchived: false
    };
    if (workspaceId) {
      teamTasksWhere.project = { workspaceId, deletedAt: null, isArchived: false };
    } else if (projectIds.length > 0) {
      teamTasksWhere.projectId = { in: projectIds };
    }

    const [teamTasks, teamMemberCount] = await Promise.all([
      prisma.task.findMany({
        where: teamTasksWhere,
        include: { column: { select: { isCompletedColumn: true } } }
      }),
      workspaceId
        ? prisma.workspaceMember.count({ where: { workspaceId } })
        : Promise.resolve(0)
    ]);

    const teamCompleted = teamTasks.filter((t) => t.column.isCompletedColumn).length;
    const teamPending = teamTasks.length - teamCompleted;
    const teamOverdue = teamTasks.filter(
      (t) => !t.column.isCompletedColumn && t.dueDate && t.dueDate < now
    ).length;

    return {
      workspacesCount,
      projects: {
        total: totalProjects,
        active: activeProjects
      },
      tasks: {
        assignedTotal: totalAssignedTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        upcomingWithin24h: upcomingDeadlines
      },
      userRole: userWorkspaceRole,
      isWorkspaceAdminOrOwner,
      priorityDistribution,
      completionVelocityPercent:
        totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : 0,
      teamStats: {
        totalTasks: teamTasks.length,
        completedTasks: teamCompleted,
        pendingTasks: teamPending,
        overdueTasks: teamOverdue,
        totalMembers: teamMemberCount,
        completionPercentage:
          teamTasks.length > 0 ? Math.round((teamCompleted / teamTasks.length) * 100) : 0
      }
    };
  }

  async getProjectAnalytics(projectId: string) {
    const now = new Date();

    const [project, tasks, members] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, key: true, status: true, priority: true }
      }),
      prisma.task.findMany({
        where: {
          projectId,
          deletedAt: null,
          isArchived: false
        },
        include: {
          column: { select: { id: true, name: true, isCompletedColumn: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
          }
        }
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } }
        }
      })
    ]);

    if (!project) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.column.isCompletedColumn).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(
      (t) => !t.column.isCompletedColumn && t.dueDate && t.dueDate < now
    ).length;

    // Distribution by priority
    const priorityCounts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };
    for (const t of tasks) {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    }

    // Member workload
    const memberStatsMap: Record<
      string,
      {
        userId: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        assigned: number;
        completed: number;
      }
    > = {};

    for (const m of members) {
      memberStatsMap[m.userId] = {
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        assigned: 0,
        completed: 0
      };
    }

    for (const t of tasks) {
      for (const a of t.assignees) {
        if (memberStatsMap[a.userId]) {
          memberStatsMap[a.userId].assigned++;
          if (t.column.isCompletedColumn) {
            memberStatsMap[a.userId].completed++;
          }
        }
      }
    }

    return {
      project,
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionPercentage
      },
      priorityBreakdown: priorityCounts,
      memberWorkload: Object.values(memberStatsMap)
    };
  }

  async getProjectReports(projectId: string) {
    const analytics = await this.getProjectAnalytics(projectId);
    if (!analytics) return null;

    // Generate completion trend and health assessment
    const isHealthy = analytics.summary.overdueTasks === 0;
    const healthStatus =
      analytics.summary.overdueTasks > 5
        ? 'AT_RISK'
        : analytics.summary.overdueTasks > 0
        ? 'NEEDS_ATTENTION'
        : 'HEALTHY';

    return {
      ...analytics,
      healthReport: {
        status: healthStatus,
        isHealthy,
        generatedAt: new Date()
      }
    };
  }
}
