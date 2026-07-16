import { Injectable, Inject, HttpException, Logger } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { OfferDocument } from './entities/offer.entity';
import { OFFER_PROVIDER } from './constants';
import { Model } from 'mongoose';
import { BotsService } from 'src/bots/bots.service';
import { getDaySubtitle } from 'src/util/get-subtitle';
import { OfferStatusEnum } from './enums/offer-status.enum';
import { incrementClicksDto } from './dto/increment-count.dto';
import { ObjectId } from 'bson';
import { offerQueryParams } from './dto/get-offer.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);
  constructor(
    @Inject(OFFER_PROVIDER)
    private readonly offerModel: Model<OfferDocument>,
    private readonly botsService: BotsService,
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    try {
      const offer = new this.offerModel(createOfferDto);
      return await offer.save();
    } catch (error) {
      this.logger.error(`Error in createOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query?: SearchParamDto) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        status,
        bot,
      } = query;

      const queryObject = {};
      if (status) queryObject['status'] = status;
      if (bot) queryObject['assignedToBots'] = { $in: [bot] };

      const offers = this.offerModel
        .find(queryObject)
        .sort({ createdAt: -1 })
        .populate('assignedToBots', 'name')
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        offers.limit(limitOfDocuments);
      }
      const data = await offers.exec();
      const count = await this.offerModel.countDocuments(queryObject);
      return { data, count };
    } catch (error) {
      this.logger.error(`Error in findAllOffers: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const offer = await this.offerModel
        .findById(id)
        .populate('assignedToBots')
        .exec();

      if (!offer) {
        throw new HttpException('Offer not found', 404);
      }
      return offer;
    } catch (error) {
      this.logger.error(`Error in findOneOffer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    try {
      const offer = await this.offerModel
        .findOneAndUpdate({ _id: id }, updateOfferDto, { new: true })
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

  async remove(id: string) {
    try {
      const offer = await this.offerModel.findById(id).exec();

      if (!offer) {
        throw new HttpException('Offer not found', 404);
      }
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

  async getTotalCount(days = 30) {
    const total = await this.offerModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
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

  async getPublishedCount(days = 30) {
    const total = await this.offerModel.countDocuments({
      status: OfferStatusEnum.PUBLISHED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
        status: OfferStatusEnum.PUBLISHED,
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

  async getDraftCount(days = 30) {
    const total = await this.offerModel.countDocuments({
      status: OfferStatusEnum.DRAFT,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.offerModel.countDocuments({
        status: OfferStatusEnum.DRAFT,
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

  async stats(days = 30) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days),
        this.getPublishedCount(days),
        this.getDraftCount(days),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOfferClickCount() {
    try {
      const offer = this.offerModel.aggregate([
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

  async findBotClicksCount(query?: SearchParamDto) {
    try {
      const offer = this.offerModel.aggregate([
        {
          $unwind: {
            path: '$clicks',
          },
        },
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
  async findTagsClicksCount(query?: SearchParamDto) {
    try {
      const advertisement = this.offerModel.aggregate([
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
  async getDateWisePerformance(params: offerQueryParams) {
    let { offerId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

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

  async dateWiseComparison(query: ComparisonDto) {
    try {
      const { param1, param2, startDate } = query;
      let endDate = query.endDate;
      if (!endDate) {
        endDate = new Date().toISOString();
      }

      const match = {};
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
                  if: { $eq: ['$_id', new ObjectId(param1)] },
                  then: 1,
                  else: 0,
                },
              },
            },
            offer2: {
              $sum: {
                $cond: {
                  if: { $eq: ['$_id', new ObjectId(param2)] },
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
  async getDayWisePerformance(params: offerQueryParams) {
    let { offerId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

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

  async findOfferDateVisitorsStats(query: offerQueryParams) {
    try {
      const { startDate, endDate, offerId } = query;

      const queryObject = {};
      if (offerId) queryObject['id'] = offerId;
      if (startDate) queryObject['createdAt'] = { $gte: startDate };
      if (endDate) queryObject['createdAt'] = { $lte: endDate };
      if (startDate && endDate)
        queryObject['createdAt'] = { $gte: startDate, $lte: endDate };
      console.log('query', queryObject);
      const offer = this.offerModel.find(queryObject);
      return offer;
    } catch (error) {
      this.logger.error(`Error while getting all offer : ${error.message}`);
      // throw new HttpException(error.message, error.status || 500);
    }
  }
}
