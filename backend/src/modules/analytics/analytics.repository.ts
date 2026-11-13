import { prisma } from '../../config/database';
import { ProjectStatus, WorkspaceRole } from '@prisma/client';

export class AnalyticsRepository {
  async getUserDashboardStats(userId: string, workspaceId?: string) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (workspaceId) {
      // Single-Round-Trip CTE Aggregation for active workspace
      const rawData: any[] = await prisma.$queryRawUnsafe(`
        WITH ws_membership AS (
          SELECT "role"
          FROM workspace_members
          WHERE "workspaceId" = $1::uuid AND "userId" = $2::uuid
          LIMIT 1
        ),
        ws_count AS (
          SELECT COUNT(*)::int AS count
          FROM workspace_members wm
          JOIN workspaces w ON w.id = wm."workspaceId"
          WHERE wm."userId" = $2::uuid AND w."deletedAt" IS NULL AND w."isArchived" = false
        ),
        members_count AS (
          SELECT COUNT(*)::int AS count
          FROM workspace_members
          WHERE "workspaceId" = $1::uuid
        ),
        accessible_projects AS (
          SELECT p.id, p.status
          FROM projects p
          LEFT JOIN ws_membership wm ON true
          WHERE p."workspaceId" = $1::uuid
            AND p."deletedAt" IS NULL
            AND p."isArchived" = false
            AND (
              wm."role" IN ('OWNER', 'ADMIN')
              OR EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm."projectId" = p.id AND pm."userId" = $2::uuid
              )
            )
        ),
        user_tasks AS (
          SELECT
            t.priority,
            t."dueDate",
            c."isCompletedColumn"
          FROM tasks t
          JOIN board_columns c ON c.id = t."boardColumnId"
          JOIN task_assignees ta ON ta."taskId" = t.id AND ta."userId" = $2::uuid
          JOIN accessible_projects ap ON ap.id = t."projectId"
          WHERE t."deletedAt" IS NULL AND t."isArchived" = false
        ),
        team_tasks AS (
          SELECT
            t."dueDate",
            c."isCompletedColumn"
          FROM tasks t
          JOIN board_columns c ON c.id = t."boardColumnId"
          JOIN accessible_projects ap ON ap.id = t."projectId"
          WHERE t."deletedAt" IS NULL AND t."isArchived" = false
        )
        SELECT
          COALESCE((SELECT count FROM ws_count), 0)::int AS "workspacesCount",
          (SELECT "role" FROM ws_membership) AS "userRole",
          COALESCE((SELECT COUNT(*)::int FROM accessible_projects), 0)::int AS "totalProjects",
          COALESCE((SELECT COUNT(*)::int FROM accessible_projects WHERE status = 'ACTIVE'), 0)::int AS "activeProjects",
          COALESCE((SELECT count FROM members_count), 0)::int AS "totalMembers",
          -- User tasks aggregations
          COALESCE((SELECT COUNT(*)::int FROM user_tasks), 0)::int AS "assignedTotal",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = true), 0)::int AS "assignedCompleted",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" < $3), 0)::int AS "assignedOverdue",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" >= $3 AND "dueDate" <= $4), 0)::int AS "assignedUpcoming",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'LOW'), 0)::int AS "assignedLow",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'MEDIUM'), 0)::int AS "assignedMedium",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'HIGH'), 0)::int AS "assignedHigh",
          COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'URGENT'), 0)::int AS "assignedUrgent",
          -- Team tasks aggregations
          COALESCE((SELECT COUNT(*)::int FROM team_tasks), 0)::int AS "teamTotal",
          COALESCE((SELECT COUNT(*)::int FROM team_tasks WHERE "isCompletedColumn" = true), 0)::int AS "teamCompleted",
          COALESCE((SELECT COUNT(*)::int FROM team_tasks WHERE "isCompletedColumn" = false AND "dueDate" < $3), 0)::int AS "teamOverdue"
      `, workspaceId, userId, now, tomorrow);

      const row = rawData[0] || {};
      const isWorkspaceAdminOrOwner = row.userRole === 'OWNER' || row.userRole === 'ADMIN';
      const totalAssigned = row.assignedTotal || 0;
      const completedAssigned = row.assignedCompleted || 0;
      const teamTotal = row.teamTotal || 0;
      const teamCompleted = row.teamCompleted || 0;

      return {
        workspacesCount: row.workspacesCount || 0,
        projects: {
          total: row.totalProjects || 0,
          active: row.activeProjects || 0
        },
        tasks: {
          assignedTotal: totalAssigned,
          completed: completedAssigned,
          pending: Math.max(0, totalAssigned - completedAssigned),
          overdue: row.assignedOverdue || 0,
          upcomingWithin24h: row.assignedUpcoming || 0
        },
        userRole: row.userRole || null,
        isWorkspaceAdminOrOwner,
        priorityDistribution: {
          LOW: row.assignedLow || 0,
          MEDIUM: row.assignedMedium || 0,
          HIGH: row.assignedHigh || 0,
          URGENT: row.assignedUrgent || 0
        },
        completionVelocityPercent:
          totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0,
        teamStats: {
          totalTasks: teamTotal,
          completedTasks: teamCompleted,
          pendingTasks: Math.max(0, teamTotal - teamCompleted),
          overdueTasks: row.teamOverdue || 0,
          totalMembers: row.totalMembers || 0,
          completionPercentage:
            teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0
        }
      };
    }

    // Global (cross-workspace) single-round-trip CTE aggregation
    const rawData: any[] = await prisma.$queryRawUnsafe(`
      WITH ws_count AS (
        SELECT COUNT(*)::int AS count
        FROM workspace_members wm
        JOIN workspaces w ON w.id = wm."workspaceId"
        WHERE wm."userId" = $1::uuid AND w."deletedAt" IS NULL AND w."isArchived" = false
      ),
      accessible_projects AS (
        SELECT p.id, p.status
        FROM projects p
        JOIN project_members pm ON pm."projectId" = p.id AND pm."userId" = $1::uuid
        JOIN workspaces w ON w.id = p."workspaceId"
        WHERE p."deletedAt" IS NULL AND p."isArchived" = false
          AND w."deletedAt" IS NULL AND w."isArchived" = false
      ),
      user_tasks AS (
        SELECT
          t.priority,
          t."dueDate",
          c."isCompletedColumn"
        FROM tasks t
        JOIN board_columns c ON c.id = t."boardColumnId"
        JOIN task_assignees ta ON ta."taskId" = t.id AND ta."userId" = $1::uuid
        JOIN accessible_projects ap ON ap.id = t."projectId"
        WHERE t."deletedAt" IS NULL AND t."isArchived" = false
      )
      SELECT
        COALESCE((SELECT count FROM ws_count), 0)::int AS "workspacesCount",
        COALESCE((SELECT COUNT(*)::int FROM accessible_projects), 0)::int AS "totalProjects",
        COALESCE((SELECT COUNT(*)::int FROM accessible_projects WHERE status = 'ACTIVE'), 0)::int AS "activeProjects",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks), 0)::int AS "assignedTotal",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = true), 0)::int AS "assignedCompleted",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" < $2), 0)::int AS "assignedOverdue",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" >= $2 AND "dueDate" <= $3), 0)::int AS "assignedUpcoming",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'LOW'), 0)::int AS "assignedLow",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'MEDIUM'), 0)::int AS "assignedMedium",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'HIGH'), 0)::int AS "assignedHigh",
        COALESCE((SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'URGENT'), 0)::int AS "assignedUrgent"
    `, userId, now, tomorrow);

    const row = rawData[0] || {};
    const totalAssigned = row.assignedTotal || 0;
    const completedAssigned = row.assignedCompleted || 0;

    return {
      workspacesCount: row.workspacesCount || 0,
      projects: {
        total: row.totalProjects || 0,
        active: row.activeProjects || 0
      },
      tasks: {
        assignedTotal: totalAssigned,
        completed: completedAssigned,
        pending: Math.max(0, totalAssigned - completedAssigned),
        overdue: row.assignedOverdue || 0,
        upcomingWithin24h: row.assignedUpcoming || 0
      },
      userRole: null,
      isWorkspaceAdminOrOwner: false,
      priorityDistribution: {
        LOW: row.assignedLow || 0,
        MEDIUM: row.assignedMedium || 0,
        HIGH: row.assignedHigh || 0,
        URGENT: row.assignedUrgent || 0
      },
      completionVelocityPercent:
        totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0,
      teamStats: {
        totalTasks: totalAssigned,
        completedTasks: completedAssigned,
        pendingTasks: Math.max(0, totalAssigned - completedAssigned),
        overdueTasks: row.assignedOverdue || 0,
        totalMembers: 0,
        completionPercentage:
          totalAssigned > 0 ? Math.round((completedAssigned / totalAssigned) * 100) : 0
      }
    };
  }

  async getProjectAnalytics(projectId: string) {
    const now = new Date();

    const [project, tasksSummary, priorityRaw, memberWorkload] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, key: true, status: true, priority: true }
      }),
      // Task summary count directly in Postgres
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (WHERE c."isCompletedColumn" = true)::int AS "completed",
          COUNT(*) FILTER (WHERE c."isCompletedColumn" = false AND t."dueDate" < $1)::int AS "overdue"
        FROM tasks t
        JOIN board_columns c ON c.id = t."boardColumnId"
        WHERE t."projectId" = $2::uuid AND t."deletedAt" IS NULL AND t."isArchived" = false
      `, now, projectId),
      // Priority distribution directly in Postgres
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*) FILTER (WHERE priority = 'LOW')::int AS "LOW",
          COUNT(*) FILTER (WHERE priority = 'MEDIUM')::int AS "MEDIUM",
          COUNT(*) FILTER (WHERE priority = 'HIGH')::int AS "HIGH",
          COUNT(*) FILTER (WHERE priority = 'URGENT')::int AS "URGENT"
        FROM tasks
        WHERE "projectId" = $1::uuid AND "deletedAt" IS NULL AND "isArchived" = false
      `, projectId),
      // Member workload directly in Postgres
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          u.id AS "userId",
          u.name,
          u.email,
          u."avatarUrl",
          COUNT(ta."taskId")::int AS "assigned",
          COUNT(ta."taskId") FILTER (WHERE c."isCompletedColumn" = true)::int AS "completed"
        FROM project_members pm
        JOIN users u ON u.id = pm."userId"
        LEFT JOIN task_assignees ta ON ta."userId" = pm."userId"
        LEFT JOIN tasks t ON t.id = ta."taskId" AND t."projectId" = pm."projectId" AND t."deletedAt" IS NULL AND t."isArchived" = false
        LEFT JOIN board_columns c ON c.id = t."boardColumnId"
        WHERE pm."projectId" = $1::uuid AND u."deletedAt" IS NULL
        GROUP BY u.id, u.name, u.email, u."avatarUrl"
        ORDER BY "assigned" DESC
      `, projectId)
    ]);

    if (!project) return null;

    const summaryRow = tasksSummary[0] || {};
    const totalTasks = summaryRow.total || 0;
    const completedTasks = summaryRow.completed || 0;
    const overdueTasks = summaryRow.overdue || 0;
    const pendingTasks = Math.max(0, totalTasks - completedTasks);
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const priRow = priorityRaw[0] || {};
    const priorityCounts: Record<string, number> = {
      LOW: priRow.LOW || 0,
      MEDIUM: priRow.MEDIUM || 0,
      HIGH: priRow.HIGH || 0,
      URGENT: priRow.URGENT || 0
    };

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
      memberWorkload
    };
  }

  async getProjectReports(projectId: string) {
    const analytics = await this.getProjectAnalytics(projectId);
    if (!analytics) return null;

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
