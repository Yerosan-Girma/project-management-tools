import { prisma } from '../src/config/database';
import { ProjectStatus, WorkspaceRole } from '@prisma/client';

async function getOptimizedDashboardStats(userId: string, workspaceId?: string) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Fetch user membership, workspaces count, and projects in parallel (Round-Trip 1)
  const [workspacesCount, membership, projectsData, teamMemberCount] = await Promise.all([
    prisma.workspaceMember.count({
      where: { userId, workspace: { deletedAt: null, isArchived: false } }
    }),
    workspaceId
      ? prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
          select: { role: true }
        })
      : Promise.resolve(null),
    prisma.project.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        ...(workspaceId
          ? { workspaceId }
          : { members: { some: { userId } } })
      },
      select: {
        id: true,
        status: true,
        members: { where: { userId }, select: { userId: true } }
      }
    }),
    workspaceId
      ? prisma.workspaceMember.count({ where: { workspaceId } })
      : Promise.resolve(0)
  ]);

  const userWorkspaceRole = membership?.role ?? null;
  const isWorkspaceAdminOrOwner =
    membership?.role === WorkspaceRole.OWNER || membership?.role === WorkspaceRole.ADMIN;

  // Filter accessible projects
  const accessibleProjects = workspaceId && !isWorkspaceAdminOrOwner
    ? projectsData.filter((p) => p.members.length > 0)
    : projectsData;

  const totalProjects = accessibleProjects.length;
  const activeProjects = accessibleProjects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
  const projectIds = accessibleProjects.map((p) => p.id);

  if (projectIds.length === 0 && !workspaceId) {
    return {
      workspacesCount,
      projects: { total: 0, active: 0 },
      tasks: { assignedTotal: 0, completed: 0, pending: 0, overdue: 0, upcomingWithin24h: 0 },
      userRole: userWorkspaceRole,
      isWorkspaceAdminOrOwner,
      priorityDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
      completionVelocityPercent: 0,
      teamStats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalMembers: teamMemberCount,
        completionPercentage: 0
      }
    };
  }

  // 2. High-performance SQL aggregation in parallel (Round-Trip 2)
  const [assignedStatsRaw, teamStatsRaw]: [any[], any[]] = await Promise.all([
    // User assigned tasks aggregated directly in Postgres
    prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE c."isCompletedColumn" = true)::int AS "completed",
        COUNT(*) FILTER (WHERE c."isCompletedColumn" = false AND t."dueDate" < $1)::int AS "overdue",
        COUNT(*) FILTER (WHERE c."isCompletedColumn" = false AND t."dueDate" >= $1 AND t."dueDate" <= $2)::int AS "upcomingWithin24h",
        COUNT(*) FILTER (WHERE t."priority" = 'LOW')::int AS "low",
        COUNT(*) FILTER (WHERE t."priority" = 'MEDIUM')::int AS "medium",
        COUNT(*) FILTER (WHERE t."priority" = 'HIGH')::int AS "high",
        COUNT(*) FILTER (WHERE t."priority" = 'URGENT')::int AS "urgent"
      FROM tasks t
      JOIN board_columns c ON t."boardColumnId" = c.id
      JOIN task_assignees ta ON ta."taskId" = t.id
      JOIN projects p ON p.id = t."projectId"
      WHERE ta."userId" = $3::uuid
        AND t."deletedAt" IS NULL
        AND t."isArchived" = false
        AND p."deletedAt" IS NULL
        AND p."isArchived" = false
        ${workspaceId ? 'AND p."workspaceId" = $4::uuid' : 'AND p.id = ANY($4::uuid[])'}
    `, now, tomorrow, userId, workspaceId ? workspaceId : projectIds),

    // Team tasks aggregated directly in Postgres
    projectIds.length > 0 || (workspaceId && isWorkspaceAdminOrOwner)
      ? prisma.$queryRawUnsafe(`
          SELECT
            COUNT(*)::int AS "total",
            COUNT(*) FILTER (WHERE c."isCompletedColumn" = true)::int AS "completed",
            COUNT(*) FILTER (WHERE c."isCompletedColumn" = false AND t."dueDate" < $1)::int AS "overdue"
          FROM tasks t
          JOIN board_columns c ON t."boardColumnId" = c.id
          JOIN projects p ON p.id = t."projectId"
          WHERE t."deletedAt" IS NULL
            AND t."isArchived" = false
            AND p."deletedAt" IS NULL
            AND p."isArchived" = false
            ${workspaceId && isWorkspaceAdminOrOwner ? 'AND p."workspaceId" = $2::uuid' : 'AND p.id = ANY($2::uuid[])'}
        `, now, workspaceId && isWorkspaceAdminOrOwner ? workspaceId : projectIds)
      : Promise.resolve([{ total: 0, completed: 0, overdue: 0 }])
  ]);

  const assignedAgg = assignedStatsRaw[0] || {};
  const totalAssignedTasks = assignedAgg.total || 0;
  const completedTasks = assignedAgg.completed || 0;
  const pendingTasks = Math.max(0, totalAssignedTasks - completedTasks);
  const overdueTasks = assignedAgg.overdue || 0;
  const upcomingDeadlines = assignedAgg.upcomingWithin24h || 0;

  const priorityDistribution = {
    LOW: assignedAgg.low || 0,
    MEDIUM: assignedAgg.medium || 0,
    HIGH: assignedAgg.high || 0,
    URGENT: assignedAgg.urgent || 0
  };

  const teamAgg = teamStatsRaw[0] || {};
  const teamTotalTasks = teamAgg.total || 0;
  const teamCompleted = teamAgg.completed || 0;
  const teamPending = Math.max(0, teamTotalTasks - teamCompleted);
  const teamOverdue = teamAgg.overdue || 0;

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
      totalTasks: teamTotalTasks,
      completedTasks: teamCompleted,
      pendingTasks: teamPending,
      overdueTasks: teamOverdue,
      totalMembers: teamMemberCount,
      completionPercentage:
        teamTotalTasks > 0 ? Math.round((teamCompleted / teamTotalTasks) * 100) : 0
    }
  };
}

async function runBenchmark() {
  const user = await prisma.user.findFirst();
  if (!user) return;
  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } }
  });

  console.log('Running optimized analytics...');
  const start = performance.now();
  const stats = await getOptimizedDashboardStats(user.id, workspace?.id);
  const dur = performance.now() - start;

  console.log(`Optimized Analytics Duration: ${dur.toFixed(1)} ms`);
  console.log('Result:', JSON.stringify(stats, null, 2));
}

runBenchmark().finally(() => prisma.$disconnect());
