import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ActivityType, Prisma } from "@prisma/client";
import { paginate } from "../common/list.util";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { ListActivitiesDto } from "./dto/list-activities.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

const ROW_SELECT = {
  id: true,
  type: true,
  subject: true,
  body: true,
  occurredAt: true,
  dueAt: true,
  completedAt: true,
  contactId: true,
  companyId: true,
  dealId: true,
  createdById: true,
  createdAt: true,
} satisfies Prisma.ActivitySelect;

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  async list(orgId: string, dto: ListActivitiesDto) {
    const db = this.crm.forOrg(orgId);
    const { skip, take } = paginate(dto);

    const and: Prisma.ActivityWhereInput[] = [{ organizationId: orgId }];
    if (dto.contactId) and.push({ contactId: dto.contactId });
    if (dto.companyId) and.push({ companyId: dto.companyId });
    if (dto.dealId) and.push({ dealId: dto.dealId });
    if (dto.type?.length) and.push({ type: { in: dto.type as ActivityType[] } });
    const where: Prisma.ActivityWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      db.activity.findMany({
        where,
        skip,
        take,
        orderBy: [
          { occurredAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        select: ROW_SELECT,
      }),
      db.activity.count({ where }),
    ]);

    return { rows, total };
  }

  async create(orgId: string, userId: string, dto: CreateActivityDto) {
    const db = this.crm.forOrg(orgId);

    if (!dto.contactId && !dto.companyId && !dto.dealId) {
      throw new BadRequestException(
        "An activity must be linked to a contact, company or deal.",
      );
    }

    await this.assertParents(orgId, dto);

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    const activity = await db.activity.create({
      data: {
        organizationId: orgId,
        type: dto.type,
        subject: blankToNull(dto.subject),
        body: blankToNull(dto.body),
        occurredAt,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        contactId: dto.contactId ?? null,
        companyId: dto.companyId ?? null,
        dealId: dto.dealId ?? null,
        createdById: userId,
      },
      select: ROW_SELECT,
    });

    await this.touchParents(orgId, dto, occurredAt);
    this.logger.log({ message: "Activity created", activityId: activity.id, orgId });
    return activity;
  }

  async update(orgId: string, id: string, dto: UpdateActivityDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);

    const data: Prisma.ActivityUpdateInput = {};
    if (dto.subject !== undefined) data.subject = blankToNull(dto.subject);
    if (dto.body !== undefined) data.body = blankToNull(dto.body);
    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }
    if (dto.completed !== undefined) {
      data.completedAt = dto.completed ? new Date() : null;
    }

    return db.activity.update({ where: { id }, data, select: ROW_SELECT });
  }

  async remove(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);
    await db.activity.delete({ where: { id } });
    return { id };
  }

  // --------------------------------------------------------------- internals

  private async assertExists(orgId: string, id: string): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const found = await db.activity.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`No activity with id ${id}.`);
  }

  private async assertParents(
    orgId: string,
    dto: CreateActivityDto,
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const checks: Promise<void>[] = [];

    if (dto.contactId) {
      checks.push(
        db.contact
          .findFirst({
            where: { id: dto.contactId, organizationId: orgId },
            select: { id: true },
          })
          .then((row) => {
            if (!row) throw new NotFoundException(`No contact with id ${dto.contactId}.`);
          }),
      );
    }
    if (dto.companyId) {
      checks.push(
        db.company
          .findFirst({
            where: { id: dto.companyId, organizationId: orgId },
            select: { id: true },
          })
          .then((row) => {
            if (!row) throw new NotFoundException(`No company with id ${dto.companyId}.`);
          }),
      );
    }
    if (dto.dealId) {
      checks.push(
        db.deal
          .findFirst({
            where: { id: dto.dealId, organizationId: orgId },
            select: { id: true },
          })
          .then((row) => {
            if (!row) throw new NotFoundException(`No deal with id ${dto.dealId}.`);
          }),
      );
    }

    await Promise.all(checks);
  }

  private async touchParents(
    orgId: string,
    dto: CreateActivityDto,
    at: Date,
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const updates: Promise<unknown>[] = [];
    if (dto.contactId) {
      updates.push(
        db.contact.updateMany({
          where: { id: dto.contactId, organizationId: orgId },
          data: { lastActivityAt: at },
        }),
      );
    }
    if (dto.companyId) {
      updates.push(
        db.company.updateMany({
          where: { id: dto.companyId, organizationId: orgId },
          data: { lastActivityAt: at },
        }),
      );
    }
    if (dto.dealId) {
      updates.push(
        db.deal.updateMany({
          where: { id: dto.dealId, organizationId: orgId },
          data: { lastActivityAt: at },
        }),
      );
    }
    await Promise.all(updates);
  }
}

function blankToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}
