import { PrismaClient, PlatformRole, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]; // 'promote' | 'create'
  const email = args[1]?.toLowerCase().trim();

  if (!command || !email) {
    console.log(`
Usage:
  1. Promote an existing user by email:
     npm run admin:promote <email>
     Example: npm run admin:promote alice@teamflow.local

  2. Create a new Platform Admin directly:
     npm run admin:create <email> [password] [name]
     Example: npm run admin:create superadmin@mycompany.com Password123! "Super Admin"
`);
    process.exit(1);
  }

  if (command === 'promote') {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      console.log(`💡 Hint: The user must register first, or use 'npm run admin:create <email> <password>' to create a new one.`);
      process.exit(1);
    }

    if (user.platformRole === PlatformRole.PLATFORM_ADMIN) {
      console.log(`ℹ️  User "${user.name}" (${user.email}) is ALREADY a Platform Administrator.`);
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        platformRole: PlatformRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log(`✅ Successfully promoted "${updated.name}" (${updated.email}) to PLATFORM_ADMIN!`);
    console.log(`They now have full system-wide administrative control.`);
    process.exit(0);
  }

  if (command === 'create') {
    const password = args[2] || 'Password123!';
    const name = args[3] || 'Platform Administrator';

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`ℹ️ User "${email}" already existed. Elevated to PLATFORM_ADMIN.`);
      process.exit(0);
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        platformRole: PlatformRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    console.log(`🎉 Successfully created new Platform Administrator:`);
    console.log(`   Name:     ${newUser.name}`);
    console.log(`   Email:    ${newUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     PLATFORM_ADMIN`);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}. Use 'promote' or 'create'.`);
  process.exit(1);
}

main()
  .catch((err) => {
    console.error('Error managing platform admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
