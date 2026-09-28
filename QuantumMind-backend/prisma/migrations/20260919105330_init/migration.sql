-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DEMO_BOOKED', 'QUALIFIED_TO_BUY', 'UNQUALIFIED_TO_BUY', 'DECISION_MAKER_BOUGHT_IN', 'CONTRACT_SENT', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK', 'STAGE_CHANGE', 'ENRICHMENT');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('MANUAL', 'IMPORT', 'EMAIL', 'CALENDAR', 'TRACKING');

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "ownerId" TEXT,
    "primaryContactId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastActivityAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "seniority" TEXT,
    "function" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "githubUrl" TEXT,
    "imageUrl" TEXT,
    "companyId" TEXT,
    "ownerId" TEXT,
    "source" "RecordSource" NOT NULL DEFAULT 'MANUAL',
    "lastActivityAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'DEMO_BOOKED',
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealContact" (
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "dealContact_pkey" PRIMARY KEY ("dealId","contactId")
);

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "companyId" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "createdById" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_primaryContactId_key" ON "company"("primaryContactId");

-- CreateIndex
CREATE INDEX "company_organizationId_name_idx" ON "company"("organizationId", "name");

-- CreateIndex
CREATE INDEX "company_organizationId_domain_idx" ON "company"("organizationId", "domain");

-- CreateIndex
CREATE INDEX "company_organizationId_ownerId_idx" ON "company"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "company_organizationId_lastActivityAt_idx" ON "company"("organizationId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "company_organizationId_archivedAt_idx" ON "company"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "contact_organizationId_email_idx" ON "contact"("organizationId", "email");

-- CreateIndex
CREATE INDEX "contact_organizationId_companyId_idx" ON "contact"("organizationId", "companyId");

-- CreateIndex
CREATE INDEX "contact_organizationId_ownerId_idx" ON "contact"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "contact_organizationId_lastActivityAt_idx" ON "contact"("organizationId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "contact_organizationId_archivedAt_idx" ON "contact"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "deal_organizationId_stage_idx" ON "deal"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "deal_organizationId_companyId_idx" ON "deal"("organizationId", "companyId");

-- CreateIndex
CREATE INDEX "deal_organizationId_ownerId_idx" ON "deal"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "deal_organizationId_expectedCloseDate_idx" ON "deal"("organizationId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "deal_organizationId_lastActivityAt_idx" ON "deal"("organizationId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "deal_organizationId_archivedAt_idx" ON "deal"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "dealContact_contactId_idx" ON "dealContact"("contactId");

-- CreateIndex
CREATE INDEX "dealContact_organizationId_idx" ON "dealContact"("organizationId");

-- CreateIndex
CREATE INDEX "activity_organizationId_companyId_createdAt_idx" ON "activity"("organizationId", "companyId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_organizationId_contactId_createdAt_idx" ON "activity"("organizationId", "contactId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_organizationId_dealId_createdAt_idx" ON "activity"("organizationId", "dealId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_organizationId_dueAt_idx" ON "activity"("organizationId", "dueAt");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealContact" ADD CONSTRAINT "dealContact_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealContact" ADD CONSTRAINT "dealContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
