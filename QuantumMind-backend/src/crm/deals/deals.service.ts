import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DealStage, Prisma } from "@prisma/client";
import {
  archivedFilter,
  countsByKey,
  FACET_UNASSIGNED,
  OrderByColumns,
  paginate,
  resolveOrderBy,
  splitSentinel,
} from "../common/list.util";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { FieldsService } from "../fields/fields.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import {
  BulkAssignDealOwnerDto,
  DealContactDto,
  UpdateDealStageDto,
} from "./dto/deal-actions.dto";
import { ListDealsDto } from "./dto/list-deals.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";

/** Stage order shown on the pipeline board (also the enum's declared order). */
const STAGE_ORDER: DealStage[] = [
  DealStage.DEMO_BOOKED,
  DealStage.QUALIFIED_TO_BUY,
  DealStage.DECISION_MAKER_BOUGHT_IN,
  DealStage.CONTRACT_SENT,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST,
  DealStage.UNQUALIFIED_TO_BUY,
];

/** Stages that represent a closed deal — reaching one stamps closedAt. */
const CLOSED_STAGES: DealStage[] = [DealStage.CLOSED_WON, DealStage.CLOSED_LOST];

const COMPANY_SELECT = {
  id: true,
  name: true,
  domain: true,
  logoUrl: true,
} satisfies Prisma.CompanySelect;

const ROW_SELECT = {
  id: true,
  name: true,
  stage: true,
  amount: true,
  currency: true,
  expectedCloseDate: true,
  ownerId: true,
  lastActivityAt: true,
  createdAt: true,
  archivedAt: true,
  company: { select: COMPANY_SELECT },
} satisfies Prisma.DealSelect;

const SORTABLE: OrderByColumns<Prisma.DealOrderByWithRelationInput[]> = {
  name: (dir) => [{ name: dir }],
  amount: (dir) => [{ amount: { sort: dir, nulls: "last" } }],
  stage: (dir) => [{ stage: dir }],
  expectedClose: (dir) => [{ expectedCloseDate: { sort: dir, nulls: "last" } }],
  createdAt: (dir) => [{ createdAt: dir }],
  lastActivity: (dir) => [{ lastActivityAt: { sort: dir, nulls: "last" } }],
};

type BulkResult = { requested: number; succeeded: number; failed: number };

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly fields: FieldsService,
  ) {}

  async list(orgId: string, dto: ListDealsDto) {
    const db = this.crm.forOrg(orgId);
    const where = this.buildWhere(orgId, dto);
    const { skip, take } = paginate(dto);

    const [rows, total, facetCounts] = await Promise.all([
      db.deal.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(dto.sort, dto.dir, SORTABLE, [
          { createdAt: "desc" },
        ]),
        select: ROW_SELECT,
      }),
      db.deal.count({ where }),
      this.facetCounts(orgId, dto),
    ]);

    const table = await this.fields.tableData(
      orgId,
      "DEAL",
      rows.map((r) => r.id),
    );
    const withFields = rows.map((r) => ({
      ...mapDeal(r),
      fields: table.valuesByRecord[r.id] ?? {},
    }));

    return { rows: withFields, total, facetCounts, fieldColumns: table.columns };
  }

  /** Pipeline board: every stage in order with its deals, count and total. */
  async pipeline(orgId: string, dto: ListDealsDto) {
    const db = this.crm.forOrg(orgId);
    const where = this.buildWhere(orgId, { ...dto, archived: false });

    const deals = await db.deal.findMany({
      where,
      orderBy: [{ lastActivityAt: { sort: "desc", nulls: "last" } }],
      take: 500,
      select: ROW_SELECT,
    });

    const byStage = new Map<DealStage, ReturnType<typeof mapDeal>[]>();
    for (const stage of STAGE_ORDER) byStage.set(stage, []);
    for (const deal of deals) {
      const mapped = mapDeal(deal);
      (byStage.get(deal.stage) ?? byStage.get(DealStage.DEMO_BOOKED))!.push(mapped);
    }

    return STAGE_ORDER.map((stage) => {
      const stageDeals = byStage.get(stage) ?? [];
      const total = stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
      return { stage, count: stageDeals.length, totalAmount: total, deals: stageDeals };
    });
  }

  async byId(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    const deal = await db.deal.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        name: true,
        description: true,
        stage: true,
        stageChangedAt: true,
        amount: true,
        currency: true,
        expectedCloseDate: true,
        closedAt: true,
        closedReason: true,
        ownerId: true,
        lastActivityAt: true,
        createdAt: true,
        archivedAt: true,
        company: { select: COMPANY_SELECT },
        contacts: {
          select: {
            role: true,
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!deal) throw new NotFoundException(`No deal with id ${id}.`);

    const { contacts, ...rest } = deal;
    return {
      ...mapDeal(rest),
      contacts: contacts.map(({ role, contact }) => ({ ...contact, role })),
    };
  }

  async create(orgId: string, userId: string, dto: CreateDealDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertCompany(orgId, dto.companyId);

    const deal = await db.deal.create({
      data: {
        organizationId: orgId,
        name: dto.name.trim(),
        description: blankToNull(dto.description),
        companyId: dto.companyId,
        ownerId: dto.ownerId ?? userId ?? null,
        stage: dto.stage ?? DealStage.DEMO_BOOKED,
        amount: dto.amount ?? null,
        currency: (dto.currency ?? "USD").toUpperCase(),
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : null,
      },
      select: { id: true, name: true, stage: true },
    });

    this.logger.log({ message: "Deal created", dealId: deal.id, orgId });
    return deal;
  }

  async update(orgId: string, id: string, dto: UpdateDealDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);

    const data: Prisma.DealUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined)
      data.description = blankToNull(dto.description);
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ?? null;
    if (dto.amount !== undefined) data.amount = dto.amount ?? null;
    if (dto.currency !== undefined)
      data.currency = (dto.currency || "USD").toUpperCase();
    if (dto.expectedCloseDate !== undefined) {
      data.expectedCloseDate = dto.expectedCloseDate
        ? new Date(dto.expectedCloseDate)
        : null;
    }

    const updated = await db.deal.update({
      where: { id },
      data,
      select: { id: true, name: true, stage: true },
    });
    return updated;
  }

  async updateStage(orgId: string, id: string, dto: UpdateDealStageDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);

    const closing = CLOSED_STAGES.includes(dto.stage);
    const updated = await db.deal.update({
      where: { id },
      data: {
        stage: dto.stage,
        stageChangedAt: new Date(),
        closedAt: closing ? new Date() : null,
        closedReason: closing ? blankToNull(dto.closedReason) : null,
      },
      select: { id: true, name: true, stage: true },
    });
    this.logger.log({ message: "Deal stage changed", dealId: id, stage: dto.stage, orgId });
    return updated;
  }

  async addContact(orgId: string, dealId: string, dto: DealContactDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, dealId);
    await this.assertContact(orgId, dto.contactId);

    await db.dealContact.upsert({
      where: { dealId_contactId: { dealId, contactId: dto.contactId } },
      create: {
        organizationId: orgId,
        dealId,
        contactId: dto.contactId,
        role: blankToNull(dto.role),
      },
      update: { role: blankToNull(dto.role) },
    });
    return { dealId, contactId: dto.contactId };
  }

  async removeContact(orgId: string, dealId: string, contactId: string) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, dealId);
    await db.dealContact.deleteMany({
      where: { dealId, contactId, organizationId: orgId },
    });
    return { dealId, contactId };
  }

  async archive(orgId: string, id: string) {
    return this.setArchived(orgId, id, new Date());
  }

  async restore(orgId: string, id: string) {
    return this.setArchived(orgId, id, null);
  }

  async purge(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);
    await db.deal.delete({ where: { id } });
    this.logger.log({ message: "Deal purged", dealId: id, orgId });
    return { id };
  }

  async bulkAssignOwner(
    orgId: string,
    dto: BulkAssignDealOwnerDto,
  ): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const ids = [...new Set(dto.ids)];
    const { count } = await db.deal.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { ownerId: dto.ownerId ?? null },
    });
    return { requested: ids.length, succeeded: count, failed: ids.length - count };
  }

  async bulkArchive(orgId: string, ids: string[]): Promise<BulkResult> {
    return this.bulkSetArchived(orgId, ids, new Date());
  }

  async bulkRestore(orgId: string, ids: string[]): Promise<BulkResult> {
    return this.bulkSetArchived(orgId, ids, null);
  }

  async bulkPurge(orgId: string, ids: string[]): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const unique = [...new Set(ids)];
    const { count } = await db.deal.deleteMany({
      where: { id: { in: unique }, organizationId: orgId },
    });
    return {
      requested: unique.length,
      succeeded: count,
      failed: unique.length - count,
    };
  }

  // --------------------------------------------------------------- internals

  private async setArchived(orgId: string, id: string, at: Date | null) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);
    const deal = await db.deal.update({
      where: { id },
      data: { archivedAt: at },
      select: { id: true, name: true },
    });
    return deal;
  }

  private async bulkSetArchived(
    orgId: string,
    ids: string[],
    at: Date | null,
  ): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const unique = [...new Set(ids)];
    const { count } = await db.deal.updateMany({
      where: { id: { in: unique }, organizationId: orgId },
      data: { archivedAt: at },
    });
    return {
      requested: unique.length,
      succeeded: count,
      failed: unique.length - count,
    };
  }

  private async assertExists(orgId: string, id: string): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const found = await db.deal.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`No deal with id ${id}.`);
  }

  private async assertCompany(orgId: string, companyId: string): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const company = await db.company.findFirst({
      where: { id: companyId, organizationId: orgId },
      select: { id: true },
    });
    if (!company) throw new NotFoundException(`No company with id ${companyId}.`);
  }

  private async assertContact(orgId: string, contactId: string): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const contact = await db.contact.findFirst({
      where: { id: contactId, organizationId: orgId },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException(`No contact with id ${contactId}.`);
  }

  private searchFilter(q?: string): Prisma.DealWhereInput {
    const term = q?.trim();
    if (!term) return {};
    return {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { company: { name: { contains: term, mode: "insensitive" } } },
      ],
    };
  }

  private buildWhere(orgId: string, dto: ListDealsDto): Prisma.DealWhereInput {
    const and: Prisma.DealWhereInput[] = [
      { organizationId: orgId },
      archivedFilter(dto.archived ?? false),
      this.searchFilter(dto.q),
    ];

    const stage = dto.stage ?? [];
    if (stage.length) and.push({ stage: { in: stage as DealStage[] } });

    const owner = dto.owner ?? [];
    if (owner.length) {
      const { ids, includesSentinel } = splitSentinel(owner, FACET_UNASSIGNED);
      if (includesSentinel && ids.length === 0) and.push({ ownerId: null });
      else if (!includesSentinel) and.push({ ownerId: { in: ids } });
      else and.push({ OR: [{ ownerId: { in: ids } }, { ownerId: null }] });
    }

    const company = dto.company ?? [];
    if (company.length) and.push({ companyId: { in: company } });

    return { AND: and };
  }

  private async facetCounts(orgId: string, dto: ListDealsDto) {
    const db = this.crm.forOrg(orgId);
    const where: Prisma.DealWhereInput = {
      AND: [
        { organizationId: orgId },
        archivedFilter(dto.archived ?? false),
        this.searchFilter(dto.q),
      ],
    };

    const [stages, owners] = await Promise.all([
      db.deal.groupBy({ by: ["stage"], where, _count: { _all: true } }),
      db.deal.groupBy({ by: ["ownerId"], where, _count: { _all: true } }),
    ]);

    return {
      stage: countsByKey(stages, "stage"),
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
    };
  }
}

function mapDeal<T extends { amount: Prisma.Decimal | null }>(
  deal: T,
): Omit<T, "amount"> & { amount: number | null } {
  return {
    ...deal,
    amount: deal.amount === null ? null : Number(deal.amount),
  };
}

function blankToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}
