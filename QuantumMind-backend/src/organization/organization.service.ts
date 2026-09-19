import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { ORGANIZATION_PROVIDER } from 'src/constants';
import { OrganizationStatus } from './enums/organization-status.enum';
import { OrganizationDocument } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @Inject(ORGANIZATION_PROVIDER)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async findById(id: string): Promise<OrganizationDocument | null> {
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
  }> {
    const [row] = await this.organizationModel.aggregate([
      {
        $group: {
          _id: null,
          bots: { $sum: '$botCount' },
          agents: { $sum: '$agentCount' },
          templates: { $sum: '$templateCount' },
        },
      },
    ]);
    return {
      bots: row?.bots ?? 0,
      agents: row?.agents ?? 0,
      templates: row?.templates ?? 0,
    };
  }

  /** URL-safe, unique-ish slug from a display name (collisions get a suffix). */
  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'org';
    let slug = base;
    let n = 1;
    while (await this.organizationModel.exists({ slug })) {
      slug = `${base}-${n++}`;
    }
    return slug;
  }

  async create(input: {
    name: string;
    createdBy?: string | null;
  }): Promise<OrganizationDocument> {
    const slug = await this.uniqueSlug(input.name);
    return this.organizationModel.create({
      name: input.name,
      slug,
      createdBy: input.createdBy ?? null,
    });
  }

  async setOwner(
    organizationId: string,
    ownerId: string,
  ): Promise<void> {
    await this.organizationModel.updateOne(
      { _id: organizationId },
      { ownerId },
    );
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
   * Race-safe quota reservation. Atomically increments a counter only if it is
   * still below `limit`; returns false when the quota is exhausted. Callers
   * must compensate (`releaseCounter`) if the subsequent create fails.
   */
  async reserveCounter(
    organizationId: string,
    field: 'botCount' | 'agentCount' | 'templateCount',
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
    field: 'botCount' | 'agentCount' | 'templateCount',
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

  async assertActive(id: string): Promise<void> {
    if (await this.isSuspended(id)) {
      throw new HttpException('Organization is suspended', 403);
    }
  }
}
