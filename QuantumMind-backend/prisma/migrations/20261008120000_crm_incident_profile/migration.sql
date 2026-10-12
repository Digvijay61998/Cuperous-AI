-- crm-incident-handover, Phase 0 (task 0.5).
--
-- Additive only: new enum value + nullable/defaulted columns + indexes. Safe
-- on a populated table; no backfill required.
--
-- PRE-CHECK: the partial unique index at the bottom fails if two active
-- contacts in one organization share an email (case-insensitive). Run
--   npm run crm:dup-check
-- first; it lists any duplicates and exits non-zero so they can be resolved
-- by a person. Duplicates are never merged automatically.

-- AlterEnum
ALTER TYPE "RecordSource" ADD VALUE IF NOT EXISTS 'CHAT';

-- AlterTable
ALTER TABLE "contact"
  ADD COLUMN "isAnonymous"     BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN "phoneNormalized" TEXT,
  ADD COLUMN "visitorIds"      TEXT[]            DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "altIdentifiers"  JSONB,
  ADD COLUMN "fieldSources"    JSONB,
  ADD COLUMN "profile"         JSONB,
  ADD COLUMN "profileVersion"  INTEGER  NOT NULL DEFAULT 0;

-- CreateIndex: phone lookups for identity matching (R2.2).
CREATE INDEX "contact_organizationId_phoneNormalized_idx"
  ON "contact" ("organizationId", "phoneNormalized");

-- Hard dedupe guard for chat-created contacts (R2.7, Property 1): at most one
-- active contact per (organization, lower(email)). Partial + expression index,
-- so it lives in raw SQL (Prisma's schema cannot express it).
CREATE UNIQUE INDEX "contact_org_lower_email_active_key"
  ON "contact" ("organizationId", lower("email"))
  WHERE "archivedAt" IS NULL AND "email" IS NOT NULL;
