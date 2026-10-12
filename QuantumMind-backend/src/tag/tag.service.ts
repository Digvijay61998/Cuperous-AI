import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose, { Model } from 'mongoose';
import { AdvertisementDocument } from 'src/advertisement/entities/advertisement.entity';
import { AgentDocument } from 'src/agent/entities/agent.entity';
import { BotDocument } from 'src/bots/entities';
import {
  assertOwnership,
  isCrossOrg,
  scopedFilter,
  TenantContext,
} from 'src/common/tenant/tenant-context';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { OfferDocument } from 'src/offer/entities/offer.entity';
import { QuestionDocument } from 'src/questions/entities/question.entity';
import { CrmPrismaService } from 'src/crm/database/crm-prisma.service';
import { getDaySubtitle } from 'src/util/get-subtitle';

import { TAG_PROVIDER } from './constant';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagDocument } from './entities/tag.entity';
import { TagTypesEnum } from './enum/tag-types.enum';

@Injectable()
export class TagService implements OnModuleInit {
  private logger = new Logger(TagService.name);

  constructor(
    @Inject(TAG_PROVIDER)
    private readonly tagModel: Model<TagDocument>,
    private readonly configService: ConfigService,
    private readonly tenantScope: TenantScopeService,
    // Service Request counts per tag come from the CRM (crm-plugins-service-desk R19.1).
    @Optional() private readonly crm?: CrmPrismaService,
  ) {}

  /** Service Requests carrying `tag`, in the caller's org (all orgs for internal / SUPER_ADMIN). */
  private serviceRequestCount(tag: string, user?: TenantContext): Promise<number> {
    if (!this.crm) return Promise.resolve(0);
    const orgId = user?.organizationId ? String(user.organizationId) : null;
    if (user && !orgId && !isCrossOrg(user)) return Promise.resolve(0);
    const db = orgId ? this.crm.forOrg(orgId) : this.crm.client;
    return db.serviceRequest
      .count({ where: { ...(orgId ? { organizationId: orgId } : {}), tags: { has: tag } } })
      .catch(() => 0);
  }

  /**
   * Visibility filter for tags. DEFAULT tags are platform-wide (seeded with
   * `organizationId: null`) and visible to every org; CUSTOM tags are visible
   * only to their owning org. SUPER_ADMIN and internal (no-user) callers are
   * unscoped.
   */
  private visibleTagFilter(
    user: TenantContext | undefined,
    filter: Record<string, any> = {},
  ): Record<string, any> {
    if (!user || isCrossOrg(user)) return filter;
    return {
      ...filter,
      $or: [
        { organizationId: user.organizationId ?? null },
        { type: TagTypesEnum.DEFAULT, organizationId: null },
      ],
    };
  }

  async onModuleInit() {
    const tagList = this.configService.get('tags.defaultTags');

    let Tags = [];
    if (typeof tagList === 'string') {
      Tags = tagList.split(',');
    } else Tags = tagList;

    Tags.forEach(async (tag: string) => {
      // Default tags are platform-wide: only look for an unowned one so an
      // org's custom tag with the same name doesn't suppress the default.
      const tagExist = await this.tagModel.findOne({
        name: tag,
        organizationId: null,
      });
      if (!tagExist) {
        await this.tagModel.create({
          name: tag,
          type: TagTypesEnum.DEFAULT,
          organizationId: null,
        });
      }
    });

    this.logger.debug(`Default tags created successfully: ${Tags.join(',')}`);
  }

  async create(createTagDto: CreateTagDto, user?: TenantContext) {
    try {
      const tag = await this.tagModel.create({
        ...createTagDto,
        type: TagTypesEnum.CUSTOM,
        // Always stamped from the caller, never from the client payload.
        organizationId: user?.organizationId ?? null,
      });
      return tag;
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTagList(user?: TenantContext) {
    try {
      const tags = await this.tagModel
        .find(this.visibleTagFilter(user))
        .select('name type')
        .sort({ name: 1 });
      const defaultTags = tags.filter(
        (tag) => tag.type === TagTypesEnum.DEFAULT,
      );
      const customTags = tags.filter((tag) => tag.type === TagTypesEnum.CUSTOM);
      return { default: defaultTags, custom: customTags };
    } catch (error) {
      this.logger.error(`Error getting tag list: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(user?: TenantContext) {
    try {
      const bots = mongoose.model<BotDocument>('Bot');
      const agents = mongoose.model<AgentDocument>('Agent');
      const offers = mongoose.model<OfferDocument>('Offer');
      const questions = mongoose.model<QuestionDocument>('Question');
      const advertisements =
        mongoose.model<AdvertisementDocument>('Advertisement');
      const tags = await this.tagModel
        .find(this.visibleTagFilter(user))
        .select('name type')
        .sort({ name: 1 });

      // Usage counts are scoped to the caller's org (unscoped for internal
      // callers / SUPER_ADMIN). Tickets carry no organizationId, so they are
      // scoped through the org's bots.
      const scope = (filter: Record<string, any>) =>
        user ? scopedFilter(user, filter) : filter;

      const data = await Promise.all(
        tags.map(async (tag) => {
          const botCount = await bots.countDocuments(
            scope({ tags: { $in: [tag._id] } }),
          );
          const agentCount = await agents.countDocuments(
            scope({ tags: { $in: [tag._id] } }),
          );

          const offerCount = await offers.countDocuments(
            scope({ 'cards.tag': { $in: [tag.name] } }),
          );
          const advertisementCount = await advertisements.countDocuments(
            scope({ 'posters.tag': { $in: [tag.name] } }),
          );
          const questionCount = await questions.countDocuments(
            scope({ tags: { $in: [tag.name] } }),
          );
          const ticketCount = await this.serviceRequestCount(tag.name, user);
          return {
            ...tag.toObject(),
            botCount,
            agentCount,
            offerCount,
            advertisementCount,
            questionCount,
            serviceRequests: ticketCount,
          };
        }),
      );

      const defaultTags = data.filter(
        (tag: any) => tag.type === TagTypesEnum.DEFAULT,
      );
      const customTags = data.filter(
        (tag: any) => tag.type === TagTypesEnum.CUSTOM,
      );
      return {
        default: defaultTags,
        custom: customTags,
      };
    } catch (error) {
      this.logger.error(`Error finding tags: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async deleteTag(tagId: string, user?: TenantContext) {
    try {
      if (!mongoose.isValidObjectId(tagId)) {
        throw new NotFoundException('Tag not found');
      }
      const tag = await this.tagModel.findOne({
        _id: tagId,
      });
      if (!tag) {
        throw new HttpException('Tag not found', 404);
      }
      // Org users may only delete their own org's tags; platform DEFAULT tags
      // (organizationId null) are therefore only deletable by SUPER_ADMIN.
      if (user) assertOwnership(user, tag);
      await tag.remove();
      return tag;
    } catch (error) {
      this.logger.error(`Error deleting tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30, user?: TenantContext) {
    const total = await this.tagModel.countDocuments(
      this.visibleTagFilter(user),
    );
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments(
        this.visibleTagFilter(user, {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - days)),
          },
        }),
      );
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Total Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async getDefaultCount(days = 30, user?: TenantContext) {
    const total = await this.tagModel.countDocuments(
      this.visibleTagFilter(user, { type: TagTypesEnum.DEFAULT }),
    );
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments(
        this.visibleTagFilter(user, {
          type: TagTypesEnum.DEFAULT,
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - days)),
          },
        }),
      );
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Default Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async getCustomCount(days = 30, user?: TenantContext) {
    const total = await this.tagModel.countDocuments(
      this.visibleTagFilter(user, { type: TagTypesEnum.CUSTOM }),
    );
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments(
        this.visibleTagFilter(user, {
          type: TagTypesEnum.CUSTOM,
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - days)),
          },
        }),
      );
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Custom Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async stats(days = 30, user?: TenantContext) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days, user),
        this.getDefaultCount(days, user),
        this.getCustomCount(days, user),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
