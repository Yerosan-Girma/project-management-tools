import { prisma } from '../src/config/database';
import argon2 from 'argon2';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      platformRole: true,
      status: true,
      deletedAt: true,
      emailVerifiedAt: true,
      createdAt: true
    }
  });

  console.log('--- ALL USERS IN DB ---');
  for (const u of users) {
    const isPass123 = await argon2.verify(u.passwordHash, 'Password123!').catch(() => false);
    console.log(`User: ${u.email} | Role: ${u.platformRole} | Password is Password123!: ${isPass123} | Status: ${u.status} | Deleted: ${u.deletedAt} | Verified: ${u.emailVerifiedAt}`);
  }
}

main().finally(() => prisma.$disconnect());
