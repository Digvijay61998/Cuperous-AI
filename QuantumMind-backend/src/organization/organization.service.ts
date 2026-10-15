import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { ORGANIZATION_PROVIDER } from 'src/constants';
import { OrganizationStatus } from './enums/organization-status.enum';
import { OrganizationDocument } from './entities/organization.entity';
import { BotStatusEnum } from 'src/bots/enums/bot-status.enum';
import { Role } from 'src/common/enums/role.enum';
import {
  defaultZoneForCountry,
  resolveOrgTimeZone,
} from 'src/common/time/org-time';

/** Denormalized per-org usage counters used for race-safe quota checks. */
export type CounterField =
  | 'botCount'
  | 'agentCount'
  | 'templateCount'
  | 'platformCount';

/** Source collection + filter that defines the real usage of each counter. */
const USAGE_SOURCES: Partial<
  Record<
    CounterField,
    {
      model: string;
      filter: (orgId: mongoose.Types.ObjectId) => Record<string, any>;
    }
  >
> = {
  // Bot deletion is a soft delete (status flip), so deleted rows stay in the
  // collection and must be excluded.
  botCount: {
    model: 'Bot',
    filter: (organizationId) => ({
      organizationId,
      status: { $ne: BotStatusEnum.DELETED },
    }),
  },
  agentCount: {
    model: 'Agent',
    filter: (organizationId) => ({
      organizationId,
      role: { $in: [Role.ORG_MANAGER, Role.AGENT] },
    }),
  },
  // Social deletion is a hard delete; every remaining row is a live connection.
  platformCount: {
    model: 'Social',
    filter: (organizationId) => ({ organizationId }),
  },
};

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @Inject(ORGANIZATION_PROVIDER)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async findById(id: string): Promise<OrganizationDocument | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.organizationModel.findById(id);
  }

  findAll(): Promise<OrganizationDocument[]> {
    return this.organizationModel.find().sort({ createdAt: -1 }).exec();
  }

  count(): Promise<number> {
    return this.organizationModel.countDocuments().exec();
  }

  /** Platform-wide sums of the denormalized resource counters. */
  async sumCounters(): Promise<{
    bots: number;
    agents: number;
    templates: number;
    platforms: number;
  }> {
    const [row] = await this.organizationModel.aggregate([
      {
        $group: {
          _id: null,
          bots: { $sum: '$botCount' },
          agents: { $sum: '$agentCount' },
          templates: { $sum: '$templateCount' },
          platforms: { $sum: '$platformCount' },
        },
      },
    ]);
    return {
      bots: row?.bots ?? 0,
      agents: row?.agents ?? 0,
      templates: row?.templates ?? 0,
      platforms: row?.platforms ?? 0,
    };
  }

  /** URL-safe slug from a display name (collisions get a numeric suffix). */
  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'org';
    let slug = base;
    let n = 1;
    while (await this.organizationModel.exists({ slug })) {
      slug = `${base}-${n++}`;
    }
    return slug;
  }

  /**
   * Creates an org. The slug pick is check-then-insert, so two concurrent
   * creates with the same name can collide on the unique index; retry with a
   * fresh slug a few times instead of surfacing a 500.
   */
  async create(input: {
    name: string;
    createdBy?: string | null;
  }): Promise<OrganizationDocument> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = await this.uniqueSlug(input.name);
      try {
        return await this.organizationModel.create({
          name: input.name.trim(),
          slug,
          createdBy: input.createdBy ?? null,
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
    throw new HttpException('Could not allocate a unique organization slug', 409);
  }

  /** Org-admin-editable settings (country / time zone). */
  async getSettings(organizationId: string) {
    const org = await this.findById(organizationId);
    if (!org) return null;
    return this.toSettingsView(org);
  }

  async updateSettings(
    organizationId: string,
    patch: { country?: string | null; timeZone?: string | null },
  ) {
    const $set: Record<string, string | null> = {};
    if (patch.country !== undefined) {
      $set.country = patch.country ? patch.country.trim().toUpperCase() : null;
    }
    if (patch.timeZone !== undefined) {
      $set.timeZone = patch.timeZone ? patch.timeZone.trim() : null;
    }
    const org = await this.organizationModel.findOneAndUpdate(
      { _id: organizationId },
      Object.keys($set).length ? { $set } : {},
      { new: true },
    );
    return org ? this.toSettingsView(org) : null;
  }

  private toSettingsView(org: OrganizationDocument) {
    const country = (org as any).country ?? null;
    const timeZone = (org as any).timeZone ?? null;
    return {
      country,
      timeZone,
      // What dates are actually shown in (explicit zone > country > UTC).
      effectiveTimeZone: resolveOrgTimeZone({ country, timeZone }),
      countryDefaultTimeZone: defaultZoneForCountry(country) ?? null,
    };
  }

  async setOwner(organizationId: string, ownerId: string): Promise<void> {
    await this.organizationModel.updateOne({ _id: organizationId }, { ownerId });
  }

  async setStatus(
    organizationId: string,
    status: OrganizationStatus,
  ): Promise<OrganizationDocument | null> {
    return this.organizationModel.findByIdAndUpdate(
      organizationId,
      { status },
      { new: true },
    );
  }

  async deleteById(organizationId: string): Promise<void> {
    await this.organizationModel.deleteOne({ _id: organizationId });
  }

  /**
   * Lean status lookup used by the suspended-org guard on every request.
   * Projects `status` only to stay a fast, index-friendly read.
   */
  async getStatus(id: string): Promise<OrganizationStatus | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const org = await this.organizationModel
      .findById(id)
      .select('status')
      .lean();
    return (org?.status as OrganizationStatus) ?? null;
  }

  async isSuspended(id: string): Promise<boolean> {
    return (await this.getStatus(id)) === OrganizationStatus.SUSPENDED;
  }

  /**
   * True when a token's org can no longer be used: suspended OR deleted.
   * A token referencing a non-existent org must not keep working.
   */
  async isUnavailable(id: string): Promise<boolean> {
    const status = await this.getStatus(id);
    return status === null || status === OrganizationStatus.SUSPENDED;
  }

  /**
   * Race-safe quota reservation. Atomically increments a counter only if it is
   * still below `limit`; returns false when the quota is exhausted. Callers
   * must compensate (`releaseCounter`) if the subsequent create fails.
   */
  async reserveCounter(
    organizationId: string,
    field: CounterField,
    limit: number,
  ): Promise<boolean> {
    const updated = await this.organizationModel.findOneAndUpdate(
      { _id: organizationId, [field]: { $lt: limit } },
      { $inc: { [field]: 1 } },
      { new: true },
    );
    return !!updated;
  }

  async releaseCounter(
    organizationId: string,
    field: CounterField,
  ): Promise<void> {
    try {
      await this.organizationModel.updateOne(
        { _id: organizationId, [field]: { $gt: 0 } },
        { $inc: { [field]: -1 } },
      );
    } catch (error) {
      // Compensating decrement is best-effort; log and continue.
      this.logger.error(
        `Failed to release ${field} for org ${organizationId}: ${error.message}`,
      );
    }
  }

  /**
   * Real usage for a counter, counted from its source collection. This is the
   * single definition of "what counts against the quota":
   *  - bots:      every bot that is not soft-deleted
   *  - agents:    org managers + agents (the org owner never consumes quota)
   *  - platforms: every social connection row (WhatsApp Web sessions included)
   * Returns null when the counter has no source (templates) or the count fails,
   * so callers never mistake an error for "zero usage".
   */
  async countActual(
    organizationId: string,
    field: CounterField,
  ): Promise<number | null> {
    const source = USAGE_SOURCES[field];
    if (!source || !mongoose.isValidObjectId(organizationId)) return null;
    const oid = new mongoose.Types.ObjectId(String(organizationId));
    try {
      return await mongoose
        .model(source.model)
        .countDocuments(source.filter(oid));
    } catch (error) {
      this.logger.error(
        `Failed to count ${field} for org ${organizationId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Resets one counter to the real usage. Returns the previous and new values,
   * or null when the real usage could not be determined (counter untouched).
   */
  async recountCounter(
    organizationId: string,
    field: CounterField,
  ): Promise<{ before: number; after: number } | null> {
    const actual = await this.countActual(organizationId, field);
    if (actual === null) return null;
    const previous = await this.organizationModel
      .findOneAndUpdate(
        { _id: organizationId },
        { $set: { [field]: actual } },
        { new: false },
      )
      .select(field)
      .lean();
    if (!previous) return null;
    return { before: Number((previous as any)[field] ?? 0), after: actual };
  }

  /**
   * Current usage for display. Uses the real counts so the UI never gates on a
   * drifted counter; falls back to the stored counter if a count fails.
   */
  async getUsage(organizationId: string): Promise<{
    bots: number;
    agents: number;
    templates: number;
    platforms: number;
  } | null> {
    const org = await this.findById(organizationId);
    if (!org) return null;
    const [bots, agents, platforms] = await Promise.all([
      this.countActual(organizationId, 'botCount'),
      this.countActual(organizationId, 'agentCount'),
      this.countActual(organizationId, 'platformCount'),
    ]);
    return {
      bots: bots ?? org.botCount ?? 0,
      agents: agents ?? org.agentCount ?? 0,
      templates: org.templateCount ?? 0,
      platforms: platforms ?? (org as any).platformCount ?? 0,
    };
  }

  /**
   * Recomputes the usage counters from the source collections. Used by the
   * super-admin console to repair drift (e.g. a crash between the counter
   * increment and the insert). A counter whose source cannot be counted is
   * left as-is rather than being reset to 0.
   */
  async reconcileCounters(organizationId: string) {
    const oid = new mongoose.Types.ObjectId(String(organizationId));
    const fields: CounterField[] = ['botCount', 'agentCount', 'platformCount'];
    const counts = await Promise.all(
      fields.map((f) => this.countActual(String(oid), f)),
    );
    const $set: Partial<Record<CounterField, number>> = {};
    fields.forEach((f, i) => {
      if (counts[i] !== null) $set[f] = counts[i] as number;
    });
    if (Object.keys($set).length) {
      await this.organizationModel.updateOne({ _id: oid }, { $set });
    }
    const org = await this.organizationModel
      .findById(oid)
      .select('botCount agentCount platformCount')
      .lean();
    return {
      botCount: (org as any)?.botCount ?? 0,
      agentCount: (org as any)?.agentCount ?? 0,
      platformCount: (org as any)?.platformCount ?? 0,
    };
  }

  async assertActive(id: string): Promise<void> {
    if (await this.isSuspended(id)) {
      throw new HttpException('Organization is suspended', 403);
    }
  }
}
