import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { FieldEntity, FieldType, Prisma } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";
import {
  CreateFieldDefinitionDto,
  ListFieldsDto,
  UpdateFieldDefinitionDto,
} from "./dto/field-definition.dto";
import { ApplyFieldValuesDto, GetFieldValuesDto } from "./dto/field-values.dto";

const DEF_SELECT = {
  id: true,
  entity: true,
  key: true,
  label: true,
  type: true,
  required: true,
  showOnSheet: true,
  showOnTable: true,
  showOnFilter: true,
  position: true,
  options: {
    where: { archivedAt: null },
    orderBy: { position: "asc" as const },
    select: { id: true, label: true, position: true },
  },
} satisfies Prisma.FieldDefinitionSelect;

// Plain value-columns object, assignable to both Prisma create and update inputs.
type ValueColumns = {
  text: string | null;
  number: number | null;
  date: Date | null;
  bool: boolean | null;
  optionId: string | null;
  userId: string | null;
};

@Injectable()
export class FieldsService {
  private readonly logger = new Logger(FieldsService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  // -------------------------------------------------------------- definitions

  async list(orgId: string, dto: ListFieldsDto) {
    const db = this.crm.forOrg(orgId);
    return db.fieldDefinition.findMany({
      where: { organizationId: orgId, entity: dto.entity, archivedAt: null },
      orderBy: { position: "asc" },
      select: DEF_SELECT,
    });
  }

  async create(orgId: string, dto: CreateFieldDefinitionDto) {
    const db = this.crm.forOrg(orgId);

    if (dto.type === FieldType.SELECT && (!dto.options || dto.options.length === 0)) {
      throw new BadRequestException("A SELECT field needs at least one option.");
    }

    try {
      return await db.fieldDefinition.create({
        data: {
          organizationId: orgId,
          entity: dto.entity,
          key: dto.key,
          label: dto.label.trim(),
          type: dto.type,
          required: dto.required ?? false,
          showOnSheet: dto.showOnSheet ?? true,
          showOnTable: dto.showOnTable ?? false,
          showOnFilter: dto.showOnFilter ?? false,
          position: dto.position ?? 0,
          options:
            dto.type === FieldType.SELECT && dto.options
              ? {
                  create: dto.options.map((opt, i) => ({
                    organizationId: orgId,
                    label: opt.label.trim(),
                    position: opt.position ?? i,
                  })),
                }
              : undefined,
        },
        select: DEF_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          `A ${dto.entity.toLowerCase()} field with key "${dto.key}" already exists.`,
        );
      }
      throw error;
    }
  }

  async update(orgId: string, id: string, dto: UpdateFieldDefinitionDto) {
    const db = this.crm.forOrg(orgId);
    const existing = await db.fieldDefinition.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, type: true },
    });
    if (!existing) throw new NotFoundException(`No field with id ${id}.`);

    const data: Prisma.FieldDefinitionUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label.trim();
    if (dto.required !== undefined) data.required = dto.required;
    if (dto.showOnSheet !== undefined) data.showOnSheet = dto.showOnSheet;
    if (dto.showOnTable !== undefined) data.showOnTable = dto.showOnTable;
    if (dto.showOnFilter !== undefined) data.showOnFilter = dto.showOnFilter;
    if (dto.position !== undefined) data.position = dto.position;

    // Options replacement (SELECT only). Removing an option nulls any value that
    // pointed at it (FieldValue.optionId onDelete: SetNull), which is intended.
    if (dto.options && existing.type === FieldType.SELECT) {
      await db.$transaction([
        db.fieldOption.deleteMany({ where: { fieldId: id } }),
        db.fieldOption.createMany({
          data: dto.options.map((opt, i) => ({
            organizationId: orgId,
            fieldId: id,
            label: opt.label.trim(),
            position: opt.position ?? i,
          })),
        }),
      ]);
    }

    await db.fieldDefinition.update({ where: { id }, data });
    return this.byId(orgId, id);
  }

  async archive(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    const existing = await db.fieldDefinition.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`No field with id ${id}.`);
    await db.fieldDefinition.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return { id };
  }

  private async byId(orgId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    return db.fieldDefinition.findFirst({
      where: { id, organizationId: orgId },
      select: DEF_SELECT,
    });
  }

  // -------------------------------------------------------------------- values

  /** Definitions for a record's entity, each with the record's current value. */
  async valuesForRecord(orgId: string, dto: GetFieldValuesDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertRecord(orgId, dto.entity, dto.recordId);

    const defs = await db.fieldDefinition.findMany({
      where: { organizationId: orgId, entity: dto.entity, archivedAt: null },
      orderBy: { position: "asc" },
      select: DEF_SELECT,
    });

    const values = await db.fieldValue.findMany({
      where: { organizationId: orgId, ...this.linkData(dto.entity, dto.recordId) },
      select: {
        fieldId: true,
        text: true,
        number: true,
        date: true,
        bool: true,
        optionId: true,
        userId: true,
      },
    });
    const byField = new Map(values.map((v) => [v.fieldId, v]));

    return defs.map((def) => ({
      ...def,
      value: resolveValue(def.type, byField.get(def.id)),
    }));
  }

  /** Upsert (or clear) the given field values for one record. */
  async applyValues(orgId: string, dto: ApplyFieldValuesDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertRecord(orgId, dto.entity, dto.recordId);

    const fieldIds = Object.keys(dto.values ?? {});
    if (fieldIds.length === 0) return { updated: 0 };

    const defs = await db.fieldDefinition.findMany({
      where: {
        organizationId: orgId,
        entity: dto.entity,
        archivedAt: null,
        id: { in: fieldIds },
      },
      select: { id: true, type: true },
    });
    const defById = new Map(defs.map((d) => [d.id, d]));

    let updated = 0;
    for (const fieldId of fieldIds) {
      const def = defById.get(fieldId);
      if (!def) continue; // ignore unknown/foreign fields
      const raw = dto.values[fieldId];

      if (isEmpty(raw)) {
        await db.fieldValue.deleteMany({
          where: { fieldId, ...this.linkData(dto.entity, dto.recordId) },
        });
        updated += 1;
        continue;
      }

      const columns = await this.coerce(orgId, def.type, fieldId, raw);
      await db.fieldValue.upsert({
        where: this.linkUnique(dto.entity, fieldId, dto.recordId),
        create: {
          organizationId: orgId,
          fieldId,
          ...this.linkData(dto.entity, dto.recordId),
          ...columns,
        },
        update: columns,
      });
      updated += 1;
    }

    return { updated };
  }

  /**
   * Columns + per-record values for fields marked `showOnTable`, for a list grid.
   * Returns the column definitions and a `{ recordId: { fieldId: value } }` map;
   * SELECT values are resolved to their option label for display.
   */
  async tableData(
    orgId: string,
    entity: FieldEntity,
    recordIds: string[],
  ): Promise<{
    columns: Array<{ id: string; key: string; label: string; type: FieldType }>;
    valuesByRecord: Record<string, Record<string, string | number | boolean | null>>;
  }> {
    const db = this.crm.forOrg(orgId);

    const columns = await db.fieldDefinition.findMany({
      where: {
        organizationId: orgId,
        entity,
        archivedAt: null,
        showOnTable: true,
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        key: true,
        label: true,
        type: true,
        options: {
          where: { archivedAt: null },
          select: { id: true, label: true },
        },
      },
    });

    if (columns.length === 0 || recordIds.length === 0) {
      return {
        columns: columns.map(({ id, key, label, type }) => ({ id, key, label, type })),
        valuesByRecord: {},
      };
    }

    const typeById = new Map(columns.map((c) => [c.id, c.type]));
    const optionLabels = new Map<string, string>();
    for (const c of columns) {
      for (const o of c.options) optionLabels.set(o.id, o.label);
    }

    const linkKey =
      entity === FieldEntity.COMPANY
        ? "companyId"
        : entity === FieldEntity.CONTACT
          ? "contactId"
          : "dealId";

    const values = await db.fieldValue.findMany({
      where: {
        organizationId: orgId,
        fieldId: { in: columns.map((c) => c.id) },
        [linkKey]: { in: recordIds },
      },
      select: {
        fieldId: true,
        companyId: true,
        contactId: true,
        dealId: true,
        text: true,
        number: true,
        date: true,
        bool: true,
        optionId: true,
        userId: true,
      },
    });

    const valuesByRecord: Record<string, Record<string, string | number | boolean | null>> = {};
    for (const v of values) {
      const recordId = (v as Record<string, unknown>)[linkKey] as string | null;
      if (!recordId) continue;
      const resolved =
        typeById.get(v.fieldId) === FieldType.SELECT
          ? v.optionId
            ? optionLabels.get(v.optionId) ?? null
            : null
          : resolveValue(typeById.get(v.fieldId) as FieldType, v);
      (valuesByRecord[recordId] ??= {})[v.fieldId] = resolved;
    }

    return {
      columns: columns.map(({ id, key, label, type }) => ({ id, key, label, type })),
      valuesByRecord,
    };
  }

  // ------------------------------------------------------------------ internals

  private async assertRecord(
    orgId: string,
    entity: FieldEntity,
    recordId: string,
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    const where = { id: recordId, organizationId: orgId };
    const found =
      entity === FieldEntity.COMPANY
        ? await db.company.findFirst({ where, select: { id: true } })
        : entity === FieldEntity.CONTACT
          ? await db.contact.findFirst({ where, select: { id: true } })
          : await db.deal.findFirst({ where, select: { id: true } });
    if (!found) {
      throw new NotFoundException(
        `No ${entity.toLowerCase()} with id ${recordId}.`,
      );
    }
  }

  private linkData(entity: FieldEntity, recordId: string) {
    if (entity === FieldEntity.COMPANY) return { companyId: recordId };
    if (entity === FieldEntity.CONTACT) return { contactId: recordId };
    return { dealId: recordId };
  }

  private linkUnique(
    entity: FieldEntity,
    fieldId: string,
    recordId: string,
  ): Prisma.FieldValueWhereUniqueInput {
    if (entity === FieldEntity.COMPANY) {
      return { fieldId_companyId: { fieldId, companyId: recordId } };
    }
    if (entity === FieldEntity.CONTACT) {
      return { fieldId_contactId: { fieldId, contactId: recordId } };
    }
    return { fieldId_dealId: { fieldId, dealId: recordId } };
  }

  private async coerce(
    orgId: string,
    type: FieldType,
    fieldId: string,
    raw: unknown,
  ): Promise<ValueColumns> {
    const cleared: ValueColumns = {
      text: null,
      number: null,
      date: null,
      bool: null,
      optionId: null,
      userId: null,
    };

    switch (type) {
      case FieldType.TEXT:
      case FieldType.LONG_TEXT:
      case FieldType.URL:
      case FieldType.EMAIL:
      case FieldType.PHONE:
        return { ...cleared, text: String(raw) };
      case FieldType.NUMBER: {
        const n = Number(raw);
        if (Number.isNaN(n)) throw new BadRequestException("Expected a number.");
        return { ...cleared, number: n };
      }
      case FieldType.DATE: {
        const d = new Date(raw as string);
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestException("Expected a valid date.");
        }
        return { ...cleared, date: d };
      }
      case FieldType.CHECKBOX:
        return { ...cleared, bool: Boolean(raw) };
      case FieldType.SELECT: {
        const optionId = String(raw);
        const db = this.crm.forOrg(orgId);
        const option = await db.fieldOption.findFirst({
          where: { id: optionId, fieldId, organizationId: orgId, archivedAt: null },
          select: { id: true },
        });
        if (!option) throw new BadRequestException("That option is not valid for this field.");
        return { ...cleared, optionId };
      }
      case FieldType.USER:
        return { ...cleared, userId: String(raw) };
      default:
        return cleared;
    }
  }
}

function isEmpty(raw: unknown): boolean {
  return (
    raw === null ||
    raw === undefined ||
    (typeof raw === "string" && raw.trim() === "")
  );
}

function resolveValue(
  type: FieldType,
  value:
    | {
        text: string | null;
        number: Prisma.Decimal | null;
        date: Date | null;
        bool: boolean | null;
        optionId: string | null;
        userId: string | null;
      }
    | undefined,
): string | number | boolean | null {
  if (!value) return null;
  switch (type) {
    case FieldType.NUMBER:
      return value.number === null ? null : Number(value.number);
    case FieldType.DATE:
      return value.date ? value.date.toISOString() : null;
    case FieldType.CHECKBOX:
      return value.bool ?? null;
    case FieldType.SELECT:
      return value.optionId ?? null;
    case FieldType.USER:
      return value.userId ?? null;
    default:
      return value.text ?? null;
  }
}
