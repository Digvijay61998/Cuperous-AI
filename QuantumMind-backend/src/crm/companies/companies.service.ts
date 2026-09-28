import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RecordSource } from "@prisma/client";
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
import { BulkAssignCompanyOwnerDto } from "./dto/bulk-companies.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { ListCompaniesDto } from "./dto/list-companies.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";

const ROW_SELECT = {
  id: true,
  name: true,
  domain: true,
  website: true,
  logoUrl: true,
  industry: true,
  city: true,
  country: true,
  ownerId: true,
  source: true,
  lastActivityAt: true,
  createdAt: true,
  archivedAt: true,
  _count: { select: { contacts: true, deals: true } },
} satisfies Prisma.CompanySelect;

const SORTABLE: OrderByColumns<Prisma.CompanyOrderByWithRelationInput[]> = {
  name: (dir) => [{ name: dir }],
  domain: (dir) => [{ domain: dir }],
  industry: (dir) => [{ industry: dir }, { name: "asc" }],
  createdAt: (dir) => [{ createdAt: dir }],
  lastActivity: (dir) => [{ lastActivityAt: { sort: dir, nulls: "last" } }],
};

type BulkResult = { requested: number; succeeded: number; failed: number };

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly fields: FieldsService,
  ) {}

  async list(orgId: string, dto: ListCompaniesDto) {
    const db = this.crm.forOrg(orgId);
    const where = this.buildWhere(orgId, dto);
    const { skip, take } = paginate(dto);

    const [rows, total, facetCounts] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(dto.sort, dto.dir, SORTABLE, [{ name: "asc" }]),
        select: ROW_SELECT,
      }),
      db.company.count({ where }),
      this.facetCounts(orgId, dto),
    ]);

    const table = await this.fields.tableData(
      orgId,
      "COMPANY",
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
    const company = await db.company.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true,
        description: true,
        logoUrl: true,
        brandColor: true,
        industry: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        linkedinUrl: true,
        ownerId: true,
        primaryContactId: true,
        source: true,
        lastActivityAt: true,
        createdAt: true,
        archivedAt: true,
        primaryContact: {
          select: { id: true, firstName: true, lastName: true, email: true, title: true },
        },
        _count: { select: { contacts: true, deals: true } },
      },
    });

    if (!company) throw new NotFoundException(`No company with id ${id}.`);
    return company;
  }

  async create(orgId: string, userId: string, dto: CreateCompanyDto) {
    const db = this.crm.forOrg(orgId);
    const domain = normalizeDomain(dto.domain);

    if (domain) await this.assertDomainFree(orgId, domain);

    const company = await db.company.create({
      data: {
        organizationId: orgId,
        name: dto.name.trim(),
        domain,
        website: blankToNull(dto.website),
        description: blankToNull(dto.description),
        industry: blankToNull(dto.industry),
        city: blankToNull(dto.city),
        country: blankToNull(dto.country),
        phone: blankToNull(dto.phone),
        email: normalizeEmail(dto.email),
        linkedinUrl: blankToNull(dto.linkedinUrl),
        ownerId: dto.ownerId ?? userId ?? null,
      },
      select: { id: true, name: true },
    });

    this.logger.log({ message: "Company created", companyId: company.id, orgId });
    return company;
  }

  async update(orgId: string, id: string, dto: UpdateCompanyDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertExists(orgId, id);

    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.website !== undefined) data.website = blankToNull(dto.website);
    if (dto.description !== undefined)
      data.description = blankToNull(dto.description);
    if (dto.industry !== undefined) data.industry = blankToNull(dto.industry);
    if (dto.city !== undefined) data.city = blankToNull(dto.city);
    if (dto.country !== undefined) data.country = blankToNull(dto.country);
    if (dto.phone !== undefined) data.phone = blankToNull(dto.phone);
    if (dto.email !== undefined) data.email = normalizeEmail(dto.email);
    if (dto.linkedinUrl !== undefined)
      data.linkedinUrl = blankToNull(dto.linkedinUrl);
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ?? null;

    if (dto.domain !== undefined) {
      const domain = normalizeDomain(dto.domain);
      if (domain) await this.assertDomainFree(orgId, domain, id);
      data.domain = domain;
    }

    if (dto.primaryContactId !== undefined) {
      if (dto.primaryContactId) {
        await this.assertContactBelongs(orgId, id, dto.primaryContactId);
        data.primaryContact = { connect: { id: dto.primaryContactId } };
      } else {
        data.primaryContact = { disconnect: true };
      }
    }

    const updated = await db.company.update({
      where: { id },
      data,
      select: { id: true, name: true },
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
    await db.company.delete({ where: { id } });
    this.logger.log({ message: "Company purged", companyId: id, orgId });
    return { id };
  }

  async bulkAssignOwner(
    orgId: string,
    dto: BulkAssignCompanyOwnerDto,
  ): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const ids = [...new Set(dto.ids)];
    const { count } = await db.company.updateMany({
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
    const { count } = await db.company.deleteMany({
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
    const company = await db.company.update({
      where: { id },
      data: { archivedAt: at },
      select: { id: true, name: true },
    });
    return company;
  }

  private async bulkSetArchived(
    orgId: string,
    ids: string[],
    at: Date | null,
  ): Promise<BulkResult> {
    const db = this.crm.forOrg(orgId);
    const unique = [...new Set(ids)];
    const { count } = await db.company.updateMany({
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
    const found = await db.company.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`No company with id ${id}.`);
  }

  private async assertDomainFree(
    orgId: string,
    domain: string,
    exceptId?: string,
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const clash = await db.company.findFirst({
      where: {
        organizationId: orgId,
        domain: { equals: domain, mode: "insensitive" },
        archivedAt: null,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true, name: true },
    });
    if (clash) {
      throw new ConflictException(`${clash.name} already uses ${domain}.`);
    }
  }

  private async assertContactBelongs(
    orgId: string,
    companyId: string,
    contactId: string,
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const contact = await db.contact.findFirst({
      where: { id: contactId, organizationId: orgId },
      select: { companyId: true },
    });
    if (!contact) throw new NotFoundException(`No contact with id ${contactId}.`);
    if (contact.companyId !== companyId) {
      throw new BadRequestException(
        "A primary contact must belong to this company.",
      );
    }
  }

  private searchFilter(q?: string): Prisma.CompanyWhereInput {
    const term = q?.trim();
    if (!term) return {};
    return {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { domain: { contains: term, mode: "insensitive" } },
      ],
    };
  }

  private buildWhere(orgId: string, dto: ListCompaniesDto): Prisma.CompanyWhereInput {
    const and: Prisma.CompanyWhereInput[] = [
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

    const industry = dto.industry ?? [];
    if (industry.length) and.push({ industry: { in: industry } });

    const source = dto.source ?? [];
    if (source.length) and.push({ source: { in: source as RecordSource[] } });

    return { AND: and };
  }

  private async facetCounts(orgId: string, dto: ListCompaniesDto) {
    const db = this.crm.forOrg(orgId);
    const where: Prisma.CompanyWhereInput = {
      AND: [
        { organizationId: orgId },
        archivedFilter(dto.archived ?? false),
        this.searchFilter(dto.q),
      ],
    };

    const [owners, industries, sources] = await Promise.all([
      db.company.groupBy({ by: ["ownerId"], where, _count: { _all: true } }),
      db.company.groupBy({ by: ["industry"], where, _count: { _all: true } }),
      db.company.groupBy({ by: ["source"], where, _count: { _all: true } }),
    ]);

    return {
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
      industry: countsByKey(industries, "industry"),
      source: countsByKey(sources, "source"),
    };
  }
}

function normalizeEmail(email?: string | null): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  return trimmed || null;
}

function normalizeDomain(domain?: string | null): string | null {
  const trimmed = (domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  return trimmed || null;
}

function blankToNull(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}
