import { prisma } from '../src/config/database';

async function main() {
  const invitations = await prisma.workspaceInvitation.findMany({
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      inviter: { select: { id: true, name: true, email: true } }
    }
  });

  console.log('--- ALL WORKSPACE INVITATIONS ---');
  for (const inv of invitations) {
    console.log(`ID: ${inv.id}`);
    console.log(`Email: ${inv.email}`);
    console.log(`Role: ${inv.role}`);
    console.log(`Status: ${inv.status}`);
    console.log(`Token: ${inv.token}`);
    console.log(`ExpiresAt: ${inv.expiresAt}`);
    console.log(`Workspace: ${inv.workspace.name} (${inv.workspace.slug})`);
    console.log(`Invited by: ${inv.inviter?.email}`);
    console.log('------------------------');
  }
}

main().finally(() => prisma.$disconnect());
