import { prisma } from '../src/config/database';

async function main() {
  console.log('=== Neon PostgreSQL Performance Audit ===');

  // 1. Check database latency
  const latencyRuns = 5;
  const latencies: number[] = [];
  for (let i = 0; i < latencyRuns; i++) {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dur = performance.now() - start;
    latencies.push(dur);
  }
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  console.log(`Measured DB Round-Trip Latencies (ms): ${latencies.map((l) => l.toFixed(1)).join(', ')}`);
  console.log(`Average DB Ping Latency: ${avgLatency.toFixed(1)} ms`);

  // 2. Count records in tables
  const counts = await Promise.all([
    prisma.user.count().then((c) => ({ table: 'users', count: c })),
    prisma.workspace.count().then((c) => ({ table: 'workspaces', count: c })),
    prisma.workspaceMember.count().then((c) => ({ table: 'workspace_members', count: c })),
    prisma.workspaceInvitation.count().then((c) => ({ table: 'workspace_invitations', count: c })),
    prisma.project.count().then((c) => ({ table: 'projects', count: c })),
    prisma.projectMember.count().then((c) => ({ table: 'project_members', count: c })),
    prisma.board.count().then((c) => ({ table: 'boards', count: c })),
    prisma.boardColumn.count().then((c) => ({ table: 'board_columns', count: c })),
    prisma.task.count().then((c) => ({ table: 'tasks', count: c })),
    prisma.taskAssignee.count().then((c) => ({ table: 'task_assignees', count: c })),
    prisma.comment.count().then((c) => ({ table: 'comments', count: c })),
    prisma.notification.count().then((c) => ({ table: 'notifications', count: c })),
    prisma.activityLog.count().then((c) => ({ table: 'activity_logs', count: c })),
  ]);
  console.log('\n=== Table Row Counts ===');
  for (const item of counts) {
    console.log(`  ${item.table.padEnd(25)}: ${item.count} rows`);
  }

  // 3. Existing Indexes
  const indexes: any = await prisma.$queryRawUnsafe(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  console.log(`\n=== Total Existing Indexes: ${indexes.length} ===`);
  for (const idx of indexes) {
    console.log(`  [${idx.tablename}] ${idx.indexname}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
