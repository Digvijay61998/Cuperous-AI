-- crm-plugins-service-desk, Phase 3 (task 3.1). Additive: new enums and tables,
-- one new FieldEntity value. Service Requests are written only here from this
-- release on (D1); old Mongo tickets are not migrated.

-- CreateEnum
CREATE TYPE "StageCategory" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'DONE');

-- CreateEnum
CREATE TYPE "ServiceRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ServiceRequestEventType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'ASSIGNED', 'PRIORITY_CHANGED', 'EDITED', 'COMMENTED', 'REOPENED', 'SUMMARY_GENERATED', 'CONTACT_LINKED');

-- AlterEnum
ALTER TYPE "FieldEntity" ADD VALUE IF NOT EXISTS 'SERVICE_REQUEST';

-- CreateTable
CREATE TABLE "serviceRequestStage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" "StageCategory" NOT NULL,
    "position" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceRequestStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "stageId" TEXT NOT NULL,
    "boardPosition" DOUBLE PRECISION NOT NULL,
    "priority" "ServiceRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactId" TEXT,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "createdById" TEXT,
    "source" TEXT NOT NULL,
    "channel" TEXT,
    "botId" TEXT NOT NULL,
    "botName" TEXT,
    "conversationId" TEXT,
    "visitorId" TEXT,
    "incidentId" TEXT,
    "summary" JSONB,
    "summaryError" TEXT,
    "transcript" JSONB,
    "transcriptAt" TIMESTAMP(3),
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstResponseAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceRequestEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "type" "ServiceRequestEventType" NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "from" JSONB,
    "to" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serviceRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceRequestComment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serviceRequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "serviceRequestStage_organizationId_position_idx" ON "serviceRequestStage"("organizationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "serviceRequest_incidentId_key" ON "serviceRequest"("incidentId");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_stageId_boardPosition_idx" ON "serviceRequest"("organizationId", "stageId", "boardPosition");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_assigneeId_idx" ON "serviceRequest"("organizationId", "assigneeId");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_contactId_idx" ON "serviceRequest"("organizationId", "contactId");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_conversationId_idx" ON "serviceRequest"("organizationId", "conversationId");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_visitorId_idx" ON "serviceRequest"("organizationId", "visitorId");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_botId_createdAt_idx" ON "serviceRequest"("organizationId", "botId", "createdAt");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_createdAt_idx" ON "serviceRequest"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "serviceRequest_organizationId_updatedAt_idx" ON "serviceRequest"("organizationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "serviceRequest_organizationId_ref_key" ON "serviceRequest"("organizationId", "ref");

-- CreateIndex
CREATE INDEX "serviceRequestEvent_serviceRequestId_createdAt_idx" ON "serviceRequestEvent"("serviceRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "serviceRequestEvent_organizationId_createdAt_idx" ON "serviceRequestEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "serviceRequestComment_serviceRequestId_createdAt_idx" ON "serviceRequestComment"("serviceRequestId", "createdAt");

-- AddForeignKey
ALTER TABLE "serviceRequest" ADD CONSTRAINT "serviceRequest_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "serviceRequestStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceRequest" ADD CONSTRAINT "serviceRequest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceRequestEvent" ADD CONSTRAINT "serviceRequestEvent_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "serviceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceRequestComment" ADD CONSTRAINT "serviceRequestComment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "serviceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
