-- AlterTable
ALTER TABLE "workspace_invitations" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "lastSentAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
