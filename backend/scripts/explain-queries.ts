import { prisma } from '../src/config/database';

async function runExplains() {
  console.log('=== EXPLAIN ANALYZE ON CRITICAL QUERIES ===\n');

  // 1. Activity log query
  const res1: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT * FROM activity_logs
    WHERE "workspaceId" = 'a67aa8be-32f3-4fb3-a5b3-9a28c0743fe2'
    ORDER BY "createdAt" DESC
    LIMIT 30;
  `);
  console.log('1. Activity logs query:');
  console.log(res1.map((r: any) => r['QUERY PLAN']).join('\n'));

  // 2. Notification unread count & list
  const res2: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT * FROM notifications
    WHERE "recipientId" = '00000000-0000-0000-0000-000000000000' AND "isRead" = false
    ORDER BY "createdAt" DESC
    LIMIT 20;
  `);
  console.log('\n2. Notifications query:');
  console.log(res2.map((r: any) => r['QUERY PLAN']).join('\n'));

  // 3. Project tasks by board column
  const res3: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT * FROM tasks
    WHERE "projectId" = '00000000-0000-0000-0000-000000000000'
      AND "deletedAt" IS NULL
      AND "isArchived" = false
    ORDER BY "position" ASC, "createdAt" DESC
    LIMIT 50;
  `);
  console.log('\n3. Tasks query:');
  console.log(res3.map((r: any) => r['QUERY PLAN']).join('\n'));
}

runExplains()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
