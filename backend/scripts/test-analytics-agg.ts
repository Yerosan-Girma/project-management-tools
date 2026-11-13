import { prisma } from '../src/config/database';
import { AnalyticsRepository } from '../src/modules/analytics/analytics.repository';

async function testAnalytics() {
  const repo = new AnalyticsRepository();
  const userId = '11111111-1111-1111-1111-111111111111'; // Yerosan or similar
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found.');
    return;
  }
  console.log(`Testing dashboard stats for user: ${user.email} (${user.id})`);

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } }
  });

  const start = performance.now();
  const stats = await repo.getUserDashboardStats(user.id, workspace?.id);
  const dur = performance.now() - start;

  console.log(`Duration: ${dur.toFixed(1)} ms`);
  console.log('Stats result:', JSON.stringify(stats, null, 2));
}

testAnalytics()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
