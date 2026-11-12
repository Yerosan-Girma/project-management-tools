DO $$
BEGIN
    CREATE TYPE "InvitationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "workspace_invitations"
    ADD COLUMN IF NOT EXISTS "projectId" UUID,
    ADD COLUMN IF NOT EXISTS "projectRole" "ProjectRole",
    ADD COLUMN IF NOT EXISTS "deliveryStatus" "InvitationDeliveryStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "workspace_invitations_projectId_idx"
    ON "workspace_invitations"("projectId");

CREATE INDEX IF NOT EXISTS "workspace_invitations_deliveryStatus_idx"
    ON "workspace_invitations"("deliveryStatus");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'workspace_invitations_projectId_fkey'
          AND conrelid = '"workspace_invitations"'::regclass
    ) THEN
        ALTER TABLE "workspace_invitations"
            ADD CONSTRAINT "workspace_invitations_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "projects"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
