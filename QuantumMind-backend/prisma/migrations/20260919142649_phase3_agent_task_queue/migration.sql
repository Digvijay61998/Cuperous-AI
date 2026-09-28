-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "contact" ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "enrichmentError" TEXT,
ADD COLUMN     "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "agentTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "companyId" TEXT,
    "dealId" TEXT,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payload" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "budget" INTEGER NOT NULL DEFAULT 4,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "leasedUntil" TIMESTAMP(3),
    "sessionId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agentTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agentTask_dueAt_leasedUntil_idx" ON "agentTask"("dueAt", "leasedUntil");

-- CreateIndex
CREATE INDEX "agentTask_organizationId_contactId_idx" ON "agentTask"("organizationId", "contactId");

-- CreateIndex
CREATE INDEX "agentTask_organizationId_kind_finishedAt_idx" ON "agentTask"("organizationId", "kind", "finishedAt");
