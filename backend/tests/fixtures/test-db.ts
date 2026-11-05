import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  'postgresql://postgres:yero12345@localhost:5432/teamflow_test_db?schema=public';

export const testPrisma = new PrismaClient({
  datasources: {
    db: { url: testDbUrl }
  }
});

export async function clearTestDatabase(): Promise<void> {
  await testPrisma.taskDependency.deleteMany();
  await testPrisma.attachment.deleteMany();
  await testPrisma.activityLog.deleteMany();
  await testPrisma.notification.deleteMany();
  await testPrisma.comment.deleteMany();
  await testPrisma.taskLabel.deleteMany();
  await testPrisma.taskAssignee.deleteMany();
  await testPrisma.task.deleteMany();
  await testPrisma.boardColumn.deleteMany();
  await testPrisma.board.deleteMany();
  await testPrisma.projectMember.deleteMany();
  await testPrisma.project.deleteMany();
  await testPrisma.label.deleteMany();
  await testPrisma.workspaceInvitation.deleteMany();
  await testPrisma.workspaceMember.deleteMany();
  await testPrisma.workspace.deleteMany();
  await testPrisma.emailVerificationToken.deleteMany();
  await testPrisma.passwordResetToken.deleteMany();
  await testPrisma.refreshToken.deleteMany();
  await testPrisma.user.deleteMany();
}

export async function createTestPasswordHash(password: string = 'Password123!'): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}
