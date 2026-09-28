import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RecordSource } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";
import {
  archivedFilter,
  countsByKey,
  FACET_UNASSIGNED,
  OrderByColumns,
  paginate,
  resolveOrderBy,
  splitSentinel,
} from "../common/list.util";
import { FieldsService } from "../fields/fields.service";
import { AgentTaskService } from "../intelligence/agent-task.service";
import { BulkAssignOwnerDto, BulkSetCompanyDto } from "./dto/bulk-contacts.dto";
import { CreateContactDto } from "./dto/create-contact.dto";
import { ListContactsDto } from "./dto/list-contacts.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

const NO_COMPANY = "none";

const COMPANY_SELECT = {
  id: true,
  name: true,
  domain: true,
  logoUrl: true,
} satisfies Prisma.CompanySelect;

const ROW_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  title: true,
  imageUrl: true,
  source: true,
  ownerId: true,
  lastActivityAt: true,
  createdAt: true,
  archivedAt: true,
  company: { select: COMPANY_SELECT },
} satisfies Prisma.ContactSelect;

const SORTABLE: OrderByColumns<Prisma.ContactOrderByWithRelationInput[]> = {
  name: (dir) => [{ lastName: dir }, { firstName: dir }],
  email: (dir) => [{ email: dir }],
  title: (dir) => [{ title: dir }, { lastName: "asc" }],
  company: (dir) => [{ company: { name: dir } }, { lastName: "asc" }],
  createdAt: (dir) => [{ createdAt: dir }],
  lastActivity: (dir) => [{ lastActivityAt: { sort: dir, nulls: "last" } }],
};

type BulkResult = {
  requested: number;
  succeeded: number;
  failed: number;
};

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly fields: FieldsService,
    private readonly agentTasks: AgentTaskService,
  ) {}

  /**
   * Queue a research/enrichment pass for a contact. Enqueue is deduped per
   * (kind, contact); the contact is marked PENDING so the UI can show "queued".
   * The actual research runs when the Phase 4 executor is registered.
   */
  async enrich(orgId: string, id: string): Promise<{ id: string; queued: boolean }> {
    await this.assertExists(orgId, id);
    const db = this.crm.forOrg(orgId);

    await this.agentTasks.scheduleTask({
      organizationId: orgId,
      contactId: id,
      kind: "enrich",
      reason: "A rep asked for a fresh look",
      priority: 300,
      dueAt: new Date(),
    });

    await db.contact.updateMany({
      where: { id, organizationId: orgId },
      data: { enrichmentStatus: "PENDING", enrichmentError: null },
    });

    return { id, queued: true };
  }

  async list(orgId: string, dto: ListContactsDto) {
    const db = this.crm.forOrg(orgId);
    const where = this.buildWhere(orgId, dto);
    const { skip, take } = paginate(dto);

    const [rows, total, facetCounts] = await Promise.all([
      db.contact.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(dto.sort, dto.dir, SORTABLE, [
          { createdAt: "desc" },
        ]),
        select: ROW_SELECT,
      }),
      db.contact.count({ where }),
      this.facetCounts(orgId, dto),
    ]);

    const table = await this.fields.tableData(
      orgId,
      "CONTACT",
      rows.map((r) => r.id),
    );
    const withFields = rows.map((r) => ({
      ...r,
      fields: table.valuesByRecord[r.id] ?? {},
    }));

    return { rows: withFields, total, facetCounts, fieldColumns: table.columns };
  }

  async byId(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    const contact = await db.contact.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        title: true,
        seniority: true,
        function: true,
        linkedinUrl: true,
        twitterUrl: true,
        githubUrl: true,
        imageUrl: true,
        source: true,
        ownerId: true,
        enrichmentStatus: true,
        enrichedAt: true,
        enrichmentError: true,
        lastActivityAt: true,
        createdAt: true,
        archivedAt: true,
        company: { select: { ...COMPANY_SELECT, industry: true } },
        deals: {
          select: {
            role: true,
            deal: {
              select: {
                id: true,
                name: true,
                stage: true,
                amount: true,
                currency: true,
                expectedCloseDate: true,
              },
            },
          },
        },
        facts: {
          where: { status: { in: ["APPLIED", "PROPOSED"] } },
          orderBy: { observedAt: "desc" },
          select: {
            id: true,
            field: true,
            value: true,
            score: true,
            band: true,
            evidence: true,
            method: true,
            sourceUrl: true,
            status: true,
            observedAt: true,
          },
        },
      },
    });

    if (!contact) throw new NotFoundException(`No contact with id ${id}.`);

    const { deals, ...rest } = contact;
    return {
      ...rest,
      deals: deals.map(({ role, deal }) => ({ ...deal, role })),
    };
  }

  async create(orgId: string, userId: string, dto: CreateContactDto) {
    const db = this.crm.forOrg(orgId);
    const email = normalizeEmail(dto.email);

    if (email) {
      const existing = await db.contact.findFirst({
        where: {
          organizationId: orgId,
          email: { equals: email, mode: "insensitive" },
          archivedAt: null,
        },
        select: { id: true, firstName: true, lastName: true },
      });
      if (existing) {
        throw new ConflictException(
          `${nameOf(existing)} already uses ${email}.`,
        );
      }
    }

    if (dto.companyId) await this.assertCompany(orgId, dto.companyId);

    const contact = await db.contact.create({
      data: {
        organizationId: orgId,
        firstName: dto.firstName.trim(),
        lastName: blankToNull(dto.lastName),
        email,
        phone: blankToNull(dto.phone),
        title: blankToNull(dto.title),
        companyId: dto.companyId ?? null,
        ownerId: dto.ownerId ?? userId ?? null,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    this.logger.log({ message: "Contact created", contactId: contact.id, orgId });
    return contact;
  }

  async update(orgId: string, id: string, dto: UpdateContactDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);

    const data: Prisma.ContactUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = blankToNull(dto.lastName);
    if (dto.phone !== undefined) data.phone = blankToNull(dto.phone);
    if (dto.title !== undefined) data.title = blankToNull(dto.title);
    if (dto.seniority !== undefined) data.seniority = blankToNull(dto.seniority);
    if (dto.function !== undefined) data.function = blankToNull(dto.function);
    if (dto.linkedinUrl !== undefined)
      data.linkedinUrl = blankToNull(dto.linkedinUrl);
    if (dto.twitterUrl !== undefined)
      data.twitterUrl = blankToNull(dto.twitterUrl);
    if (dto.githubUrl !== undefined) data.githubUrl = blankToNull(dto.githubUrl);

    if (dto.email !== undefined) {
      const email = normalizeEmail(dto.email);
      if (email) {
        const clash = await db.contact.findFirst({
          where: {
            organizationId: orgId,
            email: { equals: email, mode: "insensitive" },
            archivedAt: null,
            id: { not: id },
          },
          select: { id: true },
        });
        if (clash) {
          throw new ConflictException(
            "Another contact already uses that email address.",
          );
        }
      }
      data.email = email;
    }

    if (dto.companyId !== undefined) {
      if (dto.companyId) {
        await this.assertCompany(orgId, dto.companyId);
        data.company = { connect: { id: dto.companyId } };
      } else {
        data.company = { disconnect: true };
      }
    }

    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ?? null;

    const updated = await db.contact.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true },
    });
    return updated;
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
    await db.contact.delete({ where: { id } });
    this.logger.log({ message: "Contact purged", contactId: id, orgId });
    return { id };
  }

  async bulkAssignOwner(orgId: string, dto: BulkAssignOwnerDto): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const ids = [...new Set(dto.ids)];
    const { count } = await db.contact.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { ownerId: dto.ownerId ?? null },
    });
    return { requested: ids.length, succeeded: count, failed: ids.length - count };
  }

  async bulkSetCompany(orgId: string, dto: BulkSetCompanyDto): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    if (dto.companyId) await this.assertCompany(orgId, dto.companyId);
    const ids = [...new Set(dto.ids)];
    const { count } = await db.contact.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { companyId: dto.companyId ?? null },
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
    const { count } = await db.contact.deleteMany({
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
    const contact = await db.contact.update({
      where: { id },
      data: { archivedAt: at },
      select: { id: true, firstName: true, lastName: true },
    });
    return { id: contact.id, name: nameOf(contact) };
  }

  private async bulkSetArchived(
    orgId: string,
    ids: string[],
    at: Date | null,
  ): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const unique = [...new Set(ids)];
    const { count } = await db.contact.updateMany({
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
    const found = await db.contact.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`No contact with id ${id}.`);
  }

  private async assertCompany(orgId: string, companyId: string): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const company = await db.company.findFirst({
      where: { id: companyId, organizationId: orgId },
      select: { id: true },
    });
    if (!company) throw new NotFoundException(`No company with id ${companyId}.`);
  }

  private searchFilter(q?: string): Prisma.ContactWhereInput {
    const term = q?.trim();
    if (!term) return {};
    return {
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { company: { name: { contains: term, mode: "insensitive" } } },
      ],
    };
  }

  private buildWhere(orgId: string, dto: ListContactsDto): Prisma.ContactWhereInput {
    const and: Prisma.ContactWhereInput[] = [
      { organizationId: orgId },
      archivedFilter(dto.archived ?? false),
      this.searchFilter(dto.q),
    ];

    const owner = dto.owner ?? [];
    if (owner.length) {
      const { ids, includesSentinel } = splitSentinel(owner, FACET_UNASSIGNED);
      if (includesSentinel && ids.length === 0) and.push({ ownerId: null });
      else if (!includesSentinel) and.push({ ownerId: { in: ids } });
      else and.push({ OR: [{ ownerId: { in: ids } }, { ownerId: null }] });
    }

    const company = dto.company ?? [];
    if (company.length) {
      const { ids, includesSentinel } = splitSentinel(company, NO_COMPANY);
      if (includesSentinel && ids.length === 0) and.push({ companyId: null });
      else if (!includesSentinel) and.push({ companyId: { in: ids } });
      else and.push({ OR: [{ companyId: { in: ids } }, { companyId: null }] });
    }

    const source = dto.source ?? [];
    if (source.length) {
      and.push({ source: { in: source as RecordSource[] } });
    }

    return { AND: and };
  }

  private async facetCounts(orgId: string, dto: ListContactsDto) {
    const db = this.crm.forOrg(orgId);
    // Facets reflect the search + archived scope, but not the facet dimensions
    // themselves, so the sidebar shows what selecting each option would yield.
    const where: Prisma.ContactWhereInput = {
      AND: [
        { organizationId: orgId },
        archivedFilter(dto.archived ?? false),
        this.searchFilter(dto.q),
      ],
    };

    const [owners, companies, sources] = await Promise.all([
      db.contact.groupBy({ by: ["ownerId"], where, _count: { _all: true } }),
      db.contact.groupBy({ by: ["companyId"], where, _count: { _all: true } }),
      db.contact.groupBy({ by: ["source"], where, _count: { _all: true } }),
    ]);

    return {
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
      company: countsByKey(companies, "companyId", NO_COMPANY),
      source: countsByKey(sources, "source"),
    };
  }
}

function normalizeEmail(email?: string | null): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  return trimmed || null;
}

function blankToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function nameOf(contact: { firstName: string; lastName: string | null }): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}
