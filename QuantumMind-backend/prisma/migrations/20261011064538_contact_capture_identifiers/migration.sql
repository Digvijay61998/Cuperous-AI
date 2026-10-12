-- crm-plugins-service-desk, Phase 1 (task 1.1).
--
-- Additive: one nullable column, one enum, one table. The backfill copies the
-- current email/phone of every active contact into contactIdentifier so the
-- resolver's history lookups see rows written before this migration. When two
-- contacts share a phone (legacy data), the earliest-created one gets it, which
-- matches the resolver's "earliest wins" rule.

-- CreateEnum
CREATE TYPE "IdentifierKind" AS ENUM ('EMAIL', 'PHONE', 'TELEGRAM', 'FACEBOOK', 'WHATSAPP_LID');

-- AlterTable
ALTER TABLE "contact" ADD COLUMN     "sourceChannel" TEXT;

-- CreateTable
CREATE TABLE "contactIdentifier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "kind" "IdentifierKind" NOT NULL,
    "value" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "source" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contactIdentifier_contactId_idx" ON "contactIdentifier"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "contactIdentifier_organizationId_kind_value_key" ON "contactIdentifier"("organizationId", "kind", "value");

-- CreateIndex
CREATE INDEX "contact_organizationId_sourceChannel_idx" ON "contact"("organizationId", "sourceChannel");

-- AddForeignKey
ALTER TABLE "contactIdentifier" ADD CONSTRAINT "contactIdentifier_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: current emails (already unique per org among active contacts).
INSERT INTO "contactIdentifier" ("id", "organizationId", "contactId", "kind", "value", "display", "firstSeenAt", "lastSeenAt")
SELECT 'bf_e_' || c."id", c."organizationId", c."id", 'EMAIL', lower(trim(c."email")), lower(trim(c."email")), c."createdAt", c."updatedAt"
FROM "contact" c
WHERE c."archivedAt" IS NULL AND c."email" IS NOT NULL AND trim(c."email") <> ''
ON CONFLICT ("organizationId", "kind", "value") DO NOTHING;

-- Backfill: current phones, keyed by digits (7+), earliest contact first.
INSERT INTO "contactIdentifier" ("id", "organizationId", "contactId", "kind", "value", "display", "firstSeenAt", "lastSeenAt")
SELECT DISTINCT ON (c."organizationId", regexp_replace(coalesce(c."phoneNormalized", c."phone"), '\D', '', 'g'))
       'bf_p_' || c."id", c."organizationId", c."id", 'PHONE',
       regexp_replace(coalesce(c."phoneNormalized", c."phone"), '\D', '', 'g'),
       coalesce(c."phoneNormalized", c."phone"), c."createdAt", c."updatedAt"
FROM "contact" c
WHERE c."archivedAt" IS NULL
  AND length(regexp_replace(coalesce(c."phoneNormalized", c."phone", ''), '\D', '', 'g')) >= 7
ORDER BY c."organizationId", regexp_replace(coalesce(c."phoneNormalized", c."phone"), '\D', '', 'g'), c."createdAt" ASC
ON CONFLICT ("organizationId", "kind", "value") DO NOTHING;
