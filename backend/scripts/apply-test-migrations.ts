import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:yero12345@localhost:5432/teamflow_test_db?schema=public' }
    }
  });

  const statements = [
    `ALTER TABLE "workspace_invitations"
        ADD COLUMN IF NOT EXISTS "emailError" TEXT,
        ADD COLUMN IF NOT EXISTS "lastSentAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;`
  ];

  for (const s of statements) {
    console.log('Executing:', s);
    await prisma.$executeRawUnsafe(s);
  }

  console.log('Columns added successfully to teamflow_test_db!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
