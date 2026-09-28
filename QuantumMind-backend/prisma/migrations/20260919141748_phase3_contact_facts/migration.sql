-- CreateEnum
CREATE TYPE "FactBand" AS ENUM ('VERIFIED', 'PROBABLE', 'POSSIBLE');

-- CreateEnum
CREATE TYPE "FactStatus" AS ENUM ('APPLIED', 'PROPOSED', 'DISMISSED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "contactFact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "band" "FactBand" NOT NULL,
    "evidence" JSONB NOT NULL,
    "method" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sessionId" TEXT,
    "status" "FactStatus" NOT NULL DEFAULT 'PROPOSED',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "contactFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactBrief" (
    "contactId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "sourceUrl" TEXT,
    "sessionId" TEXT,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactBrief_pkey" PRIMARY KEY ("contactId")
);

-- CreateIndex
CREATE INDEX "contactFact_organizationId_contactId_field_status_idx" ON "contactFact"("organizationId", "contactId", "field", "status");

-- CreateIndex
CREATE INDEX "contactFact_organizationId_status_observedAt_idx" ON "contactFact"("organizationId", "status", "observedAt");

-- CreateIndex
CREATE INDEX "contactBrief_organizationId_idx" ON "contactBrief"("organizationId");

-- AddForeignKey
ALTER TABLE "contactFact" ADD CONSTRAINT "contactFact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactBrief" ADD CONSTRAINT "contactBrief_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
