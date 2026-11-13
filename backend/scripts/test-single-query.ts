import { prisma } from '../src/config/database';

async function singleQueryDashboardStats(userId: string, workspaceId: string) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const start = performance.now();
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
      (SELECT count FROM ws_count) AS "workspacesCount",
      (SELECT "role" FROM ws_membership) AS "userRole",
      (SELECT COUNT(*)::int FROM accessible_projects) AS "totalProjects",
      (SELECT COUNT(*)::int FROM accessible_projects WHERE status = 'ACTIVE') AS "activeProjects",
      (SELECT count FROM members_count) AS "totalMembers",
      -- User tasks aggregations
      (SELECT COUNT(*)::int FROM user_tasks) AS "assignedTotal",
      (SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = true) AS "assignedCompleted",
      (SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" < $3) AS "assignedOverdue",
      (SELECT COUNT(*)::int FROM user_tasks WHERE "isCompletedColumn" = false AND "dueDate" >= $3 AND "dueDate" <= $4) AS "assignedUpcoming",
      (SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'LOW') AS "assignedLow",
      (SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'MEDIUM') AS "assignedMedium",
      (SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'HIGH') AS "assignedHigh",
      (SELECT COUNT(*)::int FROM user_tasks WHERE priority = 'URGENT') AS "assignedUrgent",
      -- Team tasks aggregations
      (SELECT COUNT(*)::int FROM team_tasks) AS "teamTotal",
      (SELECT COUNT(*)::int FROM team_tasks WHERE "isCompletedColumn" = true) AS "teamCompleted",
      (SELECT COUNT(*)::int FROM team_tasks WHERE "isCompletedColumn" = false AND "dueDate" < $3) AS "teamOverdue"
  `, workspaceId, userId, now, tomorrow);

  const dur = performance.now() - start;
  console.log(`Single-Query CTE Execution Duration: ${dur.toFixed(1)} ms`);

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

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) return;
  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } }
  });
  if (!workspace) return;

  const res = await singleQueryDashboardStats(user.id, workspace.id);
  console.log('Result:', JSON.stringify(res, null, 2));
}

test().finally(() => prisma.$disconnect());
