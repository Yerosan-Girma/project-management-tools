import { PrismaClient, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

const demoEmails = [
  'admin@teamflow.local',
  'alice@teamflow.local',
  'bob@teamflow.local',
  'charlie@teamflow.local',
];

async function removeNonDemoUsers() {
  console.log('🔍 Identifying non-demo users...');
  const nonDemoUsers = await prisma.user.findMany({
    where: { email: { notIn: demoEmails } },
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${nonDemoUsers.length} non-demo users to remove:`);
  nonDemoUsers.forEach((u) => console.log(` - ${u.name} <${u.email}> (${u.id})`));
  const nonDemoUserIds = nonDemoUsers.map((u) => u.id);

  if (nonDemoUserIds.length === 0) {
    console.log('No non-demo users found.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete workspaces owned by non-demo users
    const wsDeleted = await tx.workspace.deleteMany({
      where: { ownerId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted workspaces owned by non-demo users:', wsDeleted.count);

    // 2. Delete projects created by non-demo users in remaining workspaces
    const projDeleted = await tx.project.deleteMany({
      where: { createdById: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted projects created by non-demo users:', projDeleted.count);

    // 3. Delete task assignees & tasks created by non-demo users
    const assigneesDeleted = await tx.taskAssignee.deleteMany({
      where: { OR: [{ userId: { in: nonDemoUserIds } }, { assignedById: { in: nonDemoUserIds } }] },
    });
    console.log('🗑️ Deleted task assignees for non-demo users:', assigneesDeleted.count);

    const tasksDeleted = await tx.task.deleteMany({
      where: { createdById: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted tasks created by non-demo users:', tasksDeleted.count);

    // 4. Delete comments authored by non-demo users
    const commentsDeleted = await tx.comment.deleteMany({
      where: { authorId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted comments by non-demo users:', commentsDeleted.count);

    // 5. Delete attachments uploaded by non-demo users
    const attachmentsDeleted = await tx.attachment.deleteMany({
      where: { uploaderId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted attachments by non-demo users:', attachmentsDeleted.count);

    // 6. Delete activity logs with non-demo users as actor
    const activitiesDeleted = await tx.activityLog.deleteMany({
      where: { actorId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted activity logs by non-demo users:', activitiesDeleted.count);

    // 7. Delete project memberships of non-demo users
    const pmDeleted = await tx.projectMember.deleteMany({
      where: { userId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted project memberships for non-demo users:', pmDeleted.count);

    // 8. Delete workspace memberships of non-demo users
    const wmDeleted = await tx.workspaceMember.deleteMany({
      where: { userId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted workspace memberships for non-demo users:', wmDeleted.count);

    // 9. Delete test invitations
    const invDeleted = await tx.workspaceInvitation.deleteMany({
      where: {
        OR: [
          { inviterId: { in: nonDemoUserIds } },
          { email: { notIn: demoEmails } },
        ],
      },
    });
    console.log('🗑️ Deleted invitations for non-demo users:', invDeleted.count);

    // 10. Delete notifications for non-demo users
    const notifDeleted = await tx.notification.deleteMany({
      where: { recipientId: { in: nonDemoUserIds } },
    });
    console.log('🗑️ Deleted notifications for non-demo users:', notifDeleted.count);

    // 11. Delete tokens for non-demo users
    await tx.refreshToken.deleteMany({ where: { userId: { in: nonDemoUserIds } } });
    await tx.passwordResetToken.deleteMany({ where: { userId: { in: nonDemoUserIds } } });
    await tx.emailVerificationToken.deleteMany({ where: { userId: { in: nonDemoUserIds } } });
    console.log('🗑️ Deleted auth tokens for non-demo users.');

    // 12. Delete the non-demo users
    const usersDeleted = await tx.user.deleteMany({
      where: { id: { in: nonDemoUserIds } },
    });
    console.log('✅ Deleted non-demo users:', usersDeleted.count);

    // 13. Ensure demo users are enrolled in all remaining workspaces
    const demoUsers = await tx.user.findMany({ where: { email: { in: demoEmails } } });
    const admin = demoUsers.find((u) => u.email === 'admin@teamflow.local');
    const bob = demoUsers.find((u) => u.email === 'bob@teamflow.local');
    const charlie = demoUsers.find((u) => u.email === 'charlie@teamflow.local');

    const remainingWorkspaces = await tx.workspace.findMany();
    for (const ws of remainingWorkspaces) {
      if (admin) {
        await tx.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId: ws.id, userId: admin.id } },
          create: { workspaceId: ws.id, userId: admin.id, role: WorkspaceRole.ADMIN },
          update: {},
        });
      }
      if (bob) {
        await tx.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId: ws.id, userId: bob.id } },
          create: { workspaceId: ws.id, userId: bob.id, role: WorkspaceRole.ADMIN },
          update: {},
        });
      }
      if (charlie) {
        await tx.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId: ws.id, userId: charlie.id } },
          create: { workspaceId: ws.id, userId: charlie.id, role: WorkspaceRole.MEMBER },
          update: {},
        });
      }
    }
    console.log('✨ Demo users enrolled across remaining workspaces.');
  });

  await prisma.$disconnect();
  console.log('🎉 Cleanup completed successfully.');
}

removeNonDemoUsers().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
