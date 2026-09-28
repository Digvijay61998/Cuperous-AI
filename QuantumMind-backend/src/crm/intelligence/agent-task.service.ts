import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";

export const MAX_ATTEMPTS = 5;
export const LEASE_MS = 10 * 60_000;
/** Terminal outcome for a task that exhausted its attempts. */
export const RETIRED_OUTCOME = "Gave up after too many attempts.";

export type LeasedTask = {
  id: string;
  organizationId: string;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  kind: string;
  reason: string;
  payload: Prisma.JsonValue | null;
  budget: number;
  attempts: number;
  priority: number;
  dueAt: Date;
};

export type ScheduleTaskInput = {
  organizationId: string;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  kind: string;
  reason: string;
  payload?: Prisma.InputJsonValue | null;
  dueAt?: Date;
  priority?: number;
  budget?: number;
};

/**
 * The durable agent-task queue. Enqueue (deduped per kind+record), lease with
 * FOR UPDATE SKIP LOCKED, complete, and retire. Queue rows live in the shared
 * CRM database; the worker uses the shared client (a per-tenant-DB deployment
 * would run one worker per connection). Each row carries organizationId so the
 * handler scopes its effects.
 */
@Injectable()
export class AgentTaskService {
  private readonly logger = new Logger(AgentTaskService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  /** Enqueue, or re-date an existing open task for the same (kind, record). */
  async scheduleTask(input: ScheduleTaskInput): Promise<{ id: string }> {
    const db = this.crm.forOrg(input.organizationId);
    const dueAt = input.dueAt ?? new Date();

    const existing = await db.agentTask.findFirst({
      where: {
        organizationId: input.organizationId,
        kind: input.kind,
        finishedAt: null,
        contactId: input.contactId ?? undefined,
        companyId: input.companyId ?? undefined,
        dealId: input.dealId ?? undefined,
      },
      select: { id: true },
    });

    if (existing) {
      await db.agentTask.update({
        where: { id: existing.id },
        data: { dueAt, reason: input.reason },
      });
      return existing;
    }

    return db.agentTask.create({
      data: {
        organizationId: input.organizationId,
        contactId: input.contactId ?? null,
        companyId: input.companyId ?? null,
        dealId: input.dealId ?? null,
        kind: input.kind,
        reason: input.reason,
        payload: input.payload ?? undefined,
        dueAt,
        priority: input.priority ?? 0,
        budget: input.budget ?? 4,
      },
      select: { id: true },
    });
  }

  /** Lease up to `limit` due tasks. Disjoint across concurrent workers. */
  async claimDue(limit: number, leaseMs: number = LEASE_MS): Promise<LeasedTask[]> {
    const db = this.crm.client;
    const now = new Date();
    const until = new Date(now.getTime() + leaseMs);

    const claimed = await db.$queryRaw<LeasedTask[]>`
      UPDATE "agentTask" AS t
      SET "leasedUntil" = ${until},
          "startedAt" = COALESCE(t."startedAt", ${now}),
          "attempts" = t."attempts" + 1
      FROM (
        SELECT t2.id FROM "agentTask" AS t2
        WHERE t2."finishedAt" IS NULL
          AND t2."dueAt" <= ${now}
          AND (t2."leasedUntil" IS NULL OR t2."leasedUntil" < ${now})
          AND t2."attempts" < ${MAX_ATTEMPTS}
        ORDER BY t2."priority" DESC, t2."dueAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      ) AS due
      WHERE t.id = due.id
      RETURNING t.id, t."organizationId", t."contactId", t."companyId",
        t."dealId", t.kind, t.reason, t.payload, t.budget, t.attempts,
        t.priority, t."dueAt";
    `;

    // Postgres does not order UPDATE...RETURNING by the sub-select, so re-sort.
    return claimed.sort(
      (a, b) => b.priority - a.priority || a.dueAt.getTime() - b.dueAt.getTime(),
    );
  }

  async completeTask(
    taskId: string,
    outcome: string,
    sessionId?: string,
  ): Promise<void> {
    const db = this.crm.client;
    await db.agentTask.updateMany({
      where: { id: taskId, finishedAt: null },
      data: {
        finishedAt: new Date(),
        outcome: outcome.slice(0, 500),
        sessionId: sessionId || undefined,
      },
    });
  }

  /** Close rows that have exhausted their attempts and are not leased. */
  async retireExhausted(limit = 100): Promise<number> {
    const db = this.crm.client;
    const now = new Date();
    const result = await db.$executeRaw`
      UPDATE "agentTask" AS t
      SET "finishedAt" = ${now}, "outcome" = ${RETIRED_OUTCOME}
      WHERE t.id IN (
        SELECT c.id FROM "agentTask" AS c
        WHERE c."finishedAt" IS NULL
          AND c."attempts" >= ${MAX_ATTEMPTS}
          AND (c."leasedUntil" IS NULL OR c."leasedUntil" < ${now})
        ORDER BY c."dueAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      );
    `;
    return result;
  }

  /** Count of unfinished, due tasks — for queue visibility. */
  async pendingCount(): Promise<number> {
    return this.crm.client.agentTask.count({
      where: { finishedAt: null, dueAt: { lte: new Date() } },
    });
  }
}
