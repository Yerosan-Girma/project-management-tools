import { prisma } from '../src/config/database';
import { PlatformRole, UserStatus } from '@prisma/client';

async function updateAdmins() {
  console.log('🔄 Updating Platform Administrators...');

  // 1. Ensure yerosang463@gmail.com is PLATFORM_ADMIN and ACTIVE
  let superadmin = await prisma.user.findUnique({
    where: { email: 'yerosang463@gmail.com' }
  });

  if (superadmin) {
    superadmin = await prisma.user.update({
      where: { id: superadmin.id },
      data: {
        platformRole: PlatformRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date()
      }
    });
    console.log(`✅ yerosang463@gmail.com is active PLATFORM_ADMIN.`);
  } else {
    console.log(`⚠️ yerosang463@gmail.com was not found. Please create it.`);
  }

  // 2. Remove or demote admin@teamflow.local
  const oldAdmin = await prisma.user.findUnique({
    where: { email: 'admin@teamflow.local' }
  });

  if (oldAdmin) {
    // Delete refresh tokens and delete or soft-delete
    await prisma.refreshToken.deleteMany({ where: { userId: oldAdmin.id } });
    await prisma.user.delete({ where: { id: oldAdmin.id } }).catch(async () => {
      // If foreign keys prevent hard delete, soft delete:
      await prisma.user.update({
        where: { id: oldAdmin.id },
        data: {
          deletedAt: new Date(),
          status: UserStatus.SUSPENDED,
          platformRole: PlatformRole.USER
        }
      });
    });
    console.log(`🗑️ Removed admin@teamflow.local from Platform Admins.`);
  } else {
    console.log(`ℹ️ admin@teamflow.local already does not exist.`);
  }

  // 3. Print current users
  const activeUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, platformRole: true, status: true }
  });

  console.log('\n📋 Current Active Users:');
  for (const u of activeUsers) {
    console.log(`   - ${u.name} (${u.email}) | Role: ${u.platformRole} | Status: ${u.status}`);
  }
}

updateAdmins()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
