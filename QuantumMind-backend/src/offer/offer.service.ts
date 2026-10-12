import { Injectable, Inject, HttpException, Logger } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { OfferDocument } from './entities/offer.entity';
import { OFFER_PROVIDER } from './constants';
import mongoose, { Model } from 'mongoose';
import { BotsService } from 'src/bots/bots.service';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { getDaySubtitle } from 'src/util/get-subtitle';
import { OfferStatusEnum } from './enums/offer-status.enum';
import { incrementClicksDto } from './dto/increment-count.dto';
import { ObjectId } from 'bson';
import { offerQueryParams } from './dto/get-offer.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
import {
  assertOwnership,
  isCrossOrg,
  scopedFilter,
  TenantContext,
} from 'src/common/tenant/tenant-context';
@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);
  constructor(
    @Inject(OFFER_PROVIDER)
    private readonly offerModel: Model<OfferDocument>,
    private readonly botsService: BotsService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  /**
   * `$match` fragment pinning an aggregation to the caller's organization.
   * Aggregations do not auto-cast, so the org id is converted explicitly.
   * Empty for SUPER_ADMIN; `{ organizationId: null }` when the caller has no org.
   */
  private orgMatch(user?: TenantContext): Record<string, any> {
    if (isCrossOrg(user)) return {};
    const orgId = user?.organizationId;
    return {
      organizationId:
        orgId && mongoose.isValidObjectId(orgId)
          ? new mongoose.Types.ObjectId(String(orgId))
          : null,
    };
  }

  /**
   * False when the client supplied a bot id that is malformed or outside the
   * caller's organization (callers then return an empty result).
   */
  private async botAllowed(user: TenantContext | undefined, bot?: string) {
    if (!bot) return true;
    if (!mongoose.isValidObjectId(bot)) return false;
    return this.tenantScope.isBotInOrg(user, bot);
  }

  /** Rejects assigning an offer to bots outside the caller's organization. */
  private async assertBotsInOrg(user: TenantContext | undefined, bots?: any[]) {
    if (!Array.isArray(bots)) return;
    for (const bot of bots) {
      if (!mongoose.isValidObjectId(bot?._id ?? bot)) {
        throw new HttpException('Bot not found', 404);
      }
      await this.tenantScope.assertBotInOrg(user, bot);
    }
  }

  async create(createOfferDto: CreateOfferDto, actor?: TenantContext) {
    try {
      await this.assertBotsInOrg(actor, (createOfferDto as any).assignedToBots);
      const offer = new this.offerModel({
        ...createOfferDto,
        organizationId: (actor?.organizationId as any) ?? null,
      });
      return await offer.save();
    } catch (error) {
      this.logger.error(`Error in createOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query?: SearchParamDto, user?: TenantContext) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        status,
        bot,
      } = query;

      const queryObject: Record<string, any> = {};
      if (status) queryObject['status'] = status;
      if (bot) queryObject['assignedToBots'] = { $in: [bot] };

      const scoped = scopedFilter(user, queryObject);
      const offers = this.offerModel
        .find(scoped)
        .sort({ createdAt: -1 })
        .populate('assignedToBots', 'name')
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        offers.limit(limitOfDocuments);
      }
      const data = await offers.exec();
      const count = await this.offerModel.countDocuments(scoped);
      return { data, count };
    } catch (error) {
      this.logger.error(`Error in findAllOffers: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string, user?: TenantContext) {
    try {
      const offer = await this.offerModel
        .findById(id)
        .populate('assignedToBots')
        .exec();

      if (!offer) {
        throw new HttpException('Offer not found', 404);
      }
      assertOwnership(user, offer as any);
      return offer;
    } catch (error) {
      this.logger.error(`Error in findOneOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, user?: TenantContext) {
    try {
      const existing = await this.offerModel.findById(id).select('organizationId');
      if (!existing) {
        throw new HttpException('Offer not found', 404);
      }
      assertOwnership(user, existing as any);
      await this.assertBotsInOrg(user, (updateOfferDto as any).assignedToBots);
      // Tenant fields are never client-writable (ValidationPipe does not
      // whitelist, so strip explicitly).
      const changes: Record<string, any> = { ...(updateOfferDto as any) };
      delete changes.organizationId;
      delete changes._id;
      const offer = await this.offerModel
        .findOneAndUpdate({ _id: id }, changes, { new: true })
        .exec();

      if (!offer) {
        throw new HttpException('Offer not found', 404);
      }
      return offer;
    } catch (error) {
      this.logger.error(`Error in updateOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string, user?: TenantContext) {
    try {
      const offer = await this.offerModel.findById(id).exec();

      if (!offer) {
        throw new HttpException('Offer not found', 404);
      }
      assertOwnership(user, offer as any);
      return await offer.remove();
    } catch (error) {
      this.logger.error(`Error in removeOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async incrementClicks(data: incrementClicksDto) {
    try {
      const { offerId, botId, tag } = data;
      await this.offerModel.findByIdAndUpdate(offerId, {
        $push: {
          clicks: {
            botId,
            date: new Date(),
            tag,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error while incrementing clicks: ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {});
    const total = await this.offerModel.countDocuments(scoped);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
        ...scoped,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Total Offers',
      subtitle: getDaySubtitle(days),
      type: 'offer',
    };
  }

  async getPublishedCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {
      status: OfferStatusEnum.PUBLISHED,
    });
    const total = await this.offerModel.countDocuments(scoped);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
        ...scoped,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Published Offers',
      subtitle: getDaySubtitle(days),
      type: 'offer',
    };
  }

  async getDraftCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {
      status: OfferStatusEnum.DRAFT,
    });
    const total = await this.offerModel.countDocuments(scoped);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
        ...scoped,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? 'positive' : 'negative',
      title: 'Draft Offers',
      subtitle: getDaySubtitle(days),
      type: 'offer',
    };
  }

  async stats(days = 30, user?: TenantContext) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days, user),
        this.getPublishedCount(days, user),
        this.getDraftCount(days, user),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOfferClickCount(user?: TenantContext) {
    try {
      const offer = this.offerModel.aggregate([
        { $match: this.orgMatch(user) },
        {
          $project: {
            clicksCount: { $size: '$clicks' },
            _id: 1,
            title: 1,
          },
        },
      ]);
      return offer;
    } catch (error) {
      this.logger.error(`Error while getting all offer : ${error.message}`);
      // throw new HttpException(error.message, error.status || 500);
    }
  }

  async findBotClicksCount(query?: SearchParamDto, user?: TenantContext) {
    try {
      if (!(await this.botAllowed(user, query?.bot))) return [];
      // Only count clicks attributed to the caller's own bots so the joined
      // bot names never expose another tenant's bots.
      const botIds = await this.tenantScope.orgBotIds(user);
      const clickBotMatch =
        botIds === null ? {} : { 'clicks.botId': { $in: botIds } };
      const offer = this.offerModel.aggregate([
        { $match: this.orgMatch(user) },
        {
          $unwind: {
            path: '$clicks',
          },
        },
        { $match: clickBotMatch },
        {
          $lookup: {
            from: 'bots',
            localField: 'clicks.botId',
            foreignField: '_id',
            as: 'bot',
          },
        },
        {
          $unwind: {
            path: '$bot',
          },
        },
        {
          $project: {
            bot: 1,
          },
        },
        {
          $group: {
            _id: '$bot.name',
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            bot: '$_id',
            total: 1,
            _id: 0,
          },
        },
      ]);
      return offer;
    } catch (error) {
      this.logger.error(`Error while getting all offer : ${error.message}`);
      // throw new HttpException(error.message, error.status || 500);
    }
  }
  async findTagsClicksCount(query?: SearchParamDto, user?: TenantContext) {
    try {
      if (!(await this.botAllowed(user, query?.bot))) return [];
      const advertisement = this.offerModel.aggregate([
        { $match: this.orgMatch(user) },
        {
          $unwind: {
            path: '$clicks',
          },
        },
        {
          $project: {
            clicks: 1,
          },
        },
        {
          $group: {
            _id: '$clicks.tag',
            total: { $sum: 1 },
          },
        },
      ]);
      return advertisement;
    } catch (error) {
      this.logger.error(
        `Error while getting all Advertisement : ${error.message}`,
      );
      // throw new HttpException(error.message, error.status || 500);
    }
  }
  async getDateWisePerformance(
    params: offerQueryParams,
    user?: TenantContext,
  ) {
    let { offerId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }
    if (offerId && !mongoose.isValidObjectId(offerId)) return [];

    // Org scope: a cross-org offerId simply matches nothing.
    const match: Record<string, any> = this.orgMatch(user);

    if (startDate) {
      match['createdAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (offerId) {
      match['_id'] = new ObjectId(offerId);
    }

    try {
      const data = await this.offerModel.aggregate([
        {
          $match: match,
        },
        {
          $unwind: {
            path: '$clicks',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            clicks: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: '$_id',
            clicks: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dateWiseComparison(query: ComparisonDto, user?: TenantContext) {
    try {
      const { param1, param2, startDate } = query;
      let endDate = query.endDate;
      if (!endDate) {
        endDate = new Date().toISOString();
      }
      // Unknown/malformed ids never match; cross-org ids are excluded by the
      // org $match below, so their series come back as zeros.
      const id1 = mongoose.isValidObjectId(param1)
        ? new ObjectId(param1)
        : null;
      const id2 = mongoose.isValidObjectId(param2)
        ? new ObjectId(param2)
        : null;

      const match: Record<string, any> = {};
      if (!startDate) {
        match['clicks.date'] = {
          $lte: new Date(endDate),
        };
      }
      if (startDate && endDate) {
        match['clicks.date'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const data = await this.offerModel.aggregate([
        { $match: this.orgMatch(user) },
        {
          $unwind: '$clicks',
        },
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$clicks.date',
              },
            },

            offer1: {
              $sum: {
                $cond: {
                  if: { $eq: ['$_id', id1] },
                  then: 1,
                  else: 0,
                },
              },
            },
            offer2: {
              $sum: {
                $cond: {
                  if: { $eq: ['$_id', id2] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },

        {
          $project: {
            _id: 0,
            date: '$_id',
            offer1: 1,
            offer2: 1,
          },
        },
      ]);

      return data;
    } catch (err) {
      this.logger.error(`error getting compare result: ${err.message}`);
      throw new HttpException(err.message, err.status || 500);
    }
  }
  async getDayWisePerformance(
    params: offerQueryParams,
    user?: TenantContext,
  ) {
    let { offerId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }
    if (offerId && !mongoose.isValidObjectId(offerId)) return [];

    // Org scope: a cross-org offerId simply matches nothing.
    const match: Record<string, any> = this.orgMatch(user);

    if (startDate) {
      match['createdAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (offerId) {
      match['_id'] = new ObjectId(offerId);
    }

    try {
      const data = await this.offerModel.aggregate([
        {
          $match: match,
        },
        {
          $unwind: {
            path: '$clicks',
          },
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: '$clicks.date',
            },
            clicks: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 1] }, then: 'MON' },
                  { case: { $eq: ['$_id', 2] }, then: 'TUE' },
                  { case: { $eq: ['$_id', 3] }, then: 'WED' },
                  { case: { $eq: ['$_id', 4] }, then: 'THU' },
                  { case: { $eq: ['$_id', 5] }, then: 'FRI' },
                  { case: { $eq: ['$_id', 6] }, then: 'SAT' },
                  { case: { $eq: ['$_id', 7] }, then: 'SUN' },
                ],
              },
            },
            clicks: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOfferDateVisitorsStats(
    query: offerQueryParams,
    user?: TenantContext,
  ) {
    try {
      const { startDate, endDate, offerId } = query;

      const queryObject: Record<string, any> = {};
      if (offerId) queryObject['id'] = offerId;
      if (startDate) queryObject['createdAt'] = { $gte: startDate };
      if (endDate) queryObject['createdAt'] = { $lte: endDate };
      if (startDate && endDate)
        queryObject['createdAt'] = { $gte: startDate, $lte: endDate };
      const offer = this.offerModel.find(scopedFilter(user, queryObject));
      return offer;
    } catch (error) {
      this.logger.error(`Error while getting all offer : ${error.message}`);
      // throw new HttpException(error.message, error.status || 500);
    }
  }
}
