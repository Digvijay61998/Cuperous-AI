import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, ServiceRequestEventType, StageCategory } from "@prisma/client";
import { lockKey } from "src/crm-bridge/identity";
import { CrmPrismaService } from "../database/crm-prisma.service";
import {
  assertStageInvariants,
  cleanColor,
  cleanStageName,
  DEFAULT_STAGES,
  STAGE_CATEGORIES,
  StageCategoryKey,
  StageRow,
  StageRuleError,
} from "./stage-rules";

export const STAGE_SELECT = {
  id: true,
  name: true,
  color: true,
  category: true,
  position: true,
  isDefault: true,
  archivedAt: true,
} satisfies Prisma.ServiceRequestStageSelect;

export type Stage = Prisma.ServiceRequestStageGetPayload<{ select: typeof STAGE_SELECT }>;

export interface StageInput {
  name?: string;
  color?: string | null;
  category?: string;
  isDefault?: boolean;
}

export interface Actor {
  id?: string;
  name?: string;
}

/**
 * Per-org board stages (crm-plugins-service-desk R10). Every write runs in a
 * transaction holding a per-org advisory lock, plans the full new stage list
 * and checks the invariants before writing anything.
 */
@Injectable()
export class ServiceRequestStagesService {
  private readonly logger = new Logger(ServiceRequestStagesService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  /** Active stages in board order; the defaults are created on first use (R10.1). */
  async list(orgId: string): Promise<Stage[]> {
    const db = this.crm.forOrg(orgId);
    const rows = await db.serviceRequestStage.findMany({
      where: { organizationId: orgId, archivedAt: null },
      orderBy: { position: "asc" },
      select: STAGE_SELECT,
    });
    if (rows.length) return rows;
    return this.ensureDefaults(orgId);
  }

  async ensureDefaults(orgId: string): Promise<Stage[]> {
    const db = this.crm.forOrg(orgId);
    return db.$transaction(async (tx) => {
      await this.lock(tx, orgId);
      const existing = await tx.serviceRequestStage.findMany({
        where: { organizationId: orgId, archivedAt: null },
        orderBy: { position: "asc" },
        select: STAGE_SELECT,
      });
      if (existing.length) return existing;
      for (const [position, s] of DEFAULT_STAGES.entries()) {
        await tx.serviceRequestStage.create({
          data: {
            organizationId: orgId,
            name: s.name,
            color: s.color,
            category: s.category as StageCategory,
            position,
            isDefault: !!s.isDefault,
          },
        });
      }
      return tx.serviceRequestStage.findMany({
        where: { organizationId: orgId, archivedAt: null },
        orderBy: { position: "asc" },
        select: STAGE_SELECT,
      });
    });
  }

  async byId(orgId: string, id: string): Promise<Stage> {
    const stage = await this.crm.forOrg(orgId).serviceRequestStage.findFirst({
      where: { id, organizationId: orgId, archivedAt: null },
      select: STAGE_SELECT,
    });
    if (!stage) throw new NotFoundException("No such stage.");
    return stage;
  }

  async create(orgId: string, input: StageInput): Promise<Stage[]> {
    await this.list(orgId);
    return this.write(orgId, async (tx, stages) => {
      const name = this.guard(() => cleanStageName(input.name));
      const category = this.category(input.category ?? "IN_PROGRESS");
      const color = this.guard(() => cleanColor(input.color));
      const position = stages.length ? Math.max(...stages.map((s) => s.position)) + 1 : 0;
      const planned: StageRow[] = [
        ...stages.map((s) => ({ ...s, isDefault: input.isDefault ? false : s.isDefault })),
        { id: "new", name, category, position, isDefault: !!input.isDefault },
      ];
      this.guard(() => assertStageInvariants(planned));
      if (input.isDefault) await this.clearDefault(tx, orgId);
      await tx.serviceRequestStage.create({
        data: { organizationId: orgId, name, color, category: category as StageCategory, position, isDefault: !!input.isDefault },
      });
    });
  }

  async update(orgId: string, id: string, input: StageInput): Promise<Stage[]> {
    return this.write(orgId, async (tx, stages) => {
      const current = stages.find((s) => s.id === id);
      if (!current) throw new NotFoundException("No such stage.");
      const next: StageRow = {
        ...current,
        name: input.name !== undefined ? this.guard(() => cleanStageName(input.name)) : current.name,
        category: input.category !== undefined ? this.category(input.category) : (current.category as StageCategoryKey),
        isDefault: input.isDefault === true ? true : current.isDefault,
      };
      if (input.isDefault === false && current.isDefault) {
        throw new BadRequestException("Make another stage the default instead.");
      }
      const planned = stages.map((s) => (s.id === id ? next : { ...s, isDefault: next.isDefault && s.id !== id ? false : s.isDefault }));
      this.guard(() => assertStageInvariants(planned as StageRow[]));
      if (next.isDefault && !current.isDefault) await this.clearDefault(tx, orgId);
      await tx.serviceRequestStage.update({
        where: { id },
        data: {
          name: next.name,
          category: next.category as StageCategory,
          isDefault: next.isDefault,
          ...(input.color !== undefined ? { color: this.guard(() => cleanColor(input.color)) } : {}),
        },
      });
    });
  }

  /** Board order (R10.2). Unknown ids are ignored; others keep their order after. */
  async reorder(orgId: string, ids: string[]): Promise<Stage[]> {
    return this.write(orgId, async (tx, stages) => {
      const seen = new Set<string>();
      const order: string[] = [];
      for (const id of ids || []) if (stages.some((s) => s.id === id) && !seen.has(id)) order.push(id), seen.add(id);
      for (const s of stages) if (!seen.has(s.id)) order.push(s.id);
      for (const [position, id] of order.entries()) {
        await tx.serviceRequestStage.update({ where: { id }, data: { position } });
      }
    });
  }

  /**
   * Archive a stage (R10.5). Its requests move to `moveToId` first, one
   * history event each; a stage with requests cannot go without a target.
   */
  async remove(orgId: string, id: string, moveToId: string | undefined, actor: Actor): Promise<Stage[]> {
    return this.write(orgId, async (tx, stages) => {
      const current = stages.find((s) => s.id === id);
      if (!current) throw new NotFoundException("No such stage.");
      const planned = stages.filter((s) => s.id !== id);
      this.guard(() => assertStageInvariants(planned as StageRow[]));
      const requests = await tx.serviceRequest.findMany({
        where: { organizationId: orgId, stageId: id },
        select: { id: true, closedAt: true },
      });
      if (requests.length) {
        const target = planned.find((s) => s.id === moveToId);
        if (!target) {
          throw new BadRequestException(
            `This stage has ${requests.length} request${requests.length === 1 ? "" : "s"}. Choose a stage to move ${requests.length === 1 ? "it" : "them"} to.`,
          );
        }
        const bottom = await tx.serviceRequest.aggregate({
          where: { organizationId: orgId, stageId: target.id },
          _max: { boardPosition: true },
        });
        let pos = (bottom._max.boardPosition ?? 0) + 1;
        const now = new Date();
        const toDone = target.category === "DONE";
        for (const r of requests) {
          await tx.serviceRequest.update({
            where: { id: r.id },
            data: {
              stageId: target.id,
              boardPosition: pos++,
              stageChangedAt: now,
              closedAt: toDone ? r.closedAt ?? now : null,
            },
          });
          await tx.serviceRequestEvent.create({
            data: {
              organizationId: orgId,
              serviceRequestId: r.id,
              type: ServiceRequestEventType.STAGE_CHANGED,
              actorId: actor.id ?? null,
              actorName: actor.name ?? null,
              from: { stageId: current.id, name: current.name } as Prisma.InputJsonValue,
              to: { stageId: target.id, name: target.name, reason: "stage_deleted" } as Prisma.InputJsonValue,
            },
          });
        }
      }
      await tx.serviceRequestStage.update({ where: { id }, data: { archivedAt: new Date(), isDefault: false } });
    });
  }

  // ---------------------------------------------------------------- internals

  private async write(
    orgId: string,
    fn: (tx: Prisma.TransactionClient, stages: Stage[]) => Promise<void>,
  ): Promise<Stage[]> {
    const db = this.crm.forOrg(orgId);
    await db.$transaction(async (tx) => {
      await this.lock(tx, orgId);
      const stages = await tx.serviceRequestStage.findMany({
        where: { organizationId: orgId, archivedAt: null },
        orderBy: { position: "asc" },
        select: STAGE_SELECT,
      });
      await fn(tx, stages);
    });
    return this.list(orgId);
  }

  private lock(tx: Prisma.TransactionClient, orgId: string) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, "sr-stages")})`;
  }

  private clearDefault(tx: Prisma.TransactionClient, orgId: string) {
    return tx.serviceRequestStage.updateMany({
      where: { organizationId: orgId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private category(value: unknown): StageCategoryKey {
    const v = String(value ?? "").toUpperCase();
    if (!(STAGE_CATEGORIES as readonly string[]).includes(v)) {
      throw new BadRequestException(`Category must be one of ${STAGE_CATEGORIES.join(", ")}.`);
    }
    return v as StageCategoryKey;
  }

  private guard<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      if (error instanceof StageRuleError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
