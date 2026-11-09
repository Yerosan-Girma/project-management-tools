import { prisma } from '../src/config/database';

async function listWorkspaces() {
  const ws = await prisma.workspace.findMany({
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, platformRole: true } }
        }
      },
      invitations: true
    }
  });

  for (const w of ws) {
    console.log(`=== WORKSPACE: ${w.name} (${w.id}) ===`);
    console.log('Members:');
    for (const m of w.members) {
      console.log(`  - ${m.user.email} | Role: ${m.role} | PlatformRole: ${m.user.platformRole}`);
    }
    console.log('Invitations:');
    for (const inv of w.invitations) {
      console.log(`  - ${inv.email} | Role: ${inv.role} | Status: ${inv.status} | Token: ${inv.token}`);
    }
  }
}

listWorkspaces().finally(() => prisma.$disconnect());
