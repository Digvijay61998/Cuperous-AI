import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose, { Model } from 'mongoose';
import { AdvertisementDocument } from 'src/advertisement/entities/advertisement.entity';
import { AgentDocument } from 'src/agent/entities/agent.entity';
import { BotDocument } from 'src/bots/entities';
import { OfferDocument } from 'src/offer/entities/offer.entity';
import { QuestionDocument } from 'src/questions/entities/question.entity';
import { TicketDocument } from 'src/tickets/entities/ticket.entity';
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
  ) {}

  async onModuleInit() {
    const tagList = this.configService.get('tags.defaultTags');

    let Tags = [];
    if (typeof tagList === 'string') {
      Tags = tagList.split(',');
    } else Tags = tagList;

    Tags.forEach(async (tag: string) => {
      const tagExist = await this.tagModel.findOne({ name: tag });
      if (!tagExist) {
        await this.tagModel.create({
          name: tag,
          type: TagTypesEnum.DEFAULT,
        });
      }
    });

    this.logger.debug(`Default tags created successfully: ${Tags.join(',')}`);
  }

  async create(createTagDto: CreateTagDto) {
    try {
      const tag = await this.tagModel.create({
        ...createTagDto,

        type: TagTypesEnum.CUSTOM,
      });
      return tag;
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTagList() {
    try {
      const tags = await this.tagModel
        .find()
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

  async findAll() {
    try {
      const tickets = mongoose.model<TicketDocument>('Ticket');
      const bots = mongoose.model<BotDocument>('Bot');
      const agents = mongoose.model<AgentDocument>('Agent');
      const offers = mongoose.model<OfferDocument>('Offer');
      const questions = mongoose.model<QuestionDocument>('Question');
      const advertisements =
        mongoose.model<AdvertisementDocument>('Advertisement');
      const tags = await this.tagModel
        .find()
        .select('name type')
        .sort({ name: 1 });

      const data = await Promise.all(
        tags.map(async (tag) => {
          const botCount = await bots.countDocuments({
            tags: { $in: [tag._id] },
          });
          const agentCount = await agents.countDocuments({
            tags: { $in: [tag._id] },
          });

          const offerCount = await offers.countDocuments({
            'cards.tag': { $in: [tag.name] },
          });
          const advertisementCount = await advertisements.countDocuments({
            'posters.tag': { $in: [tag.name] },
          });
          const questionCount = await questions.countDocuments({
            tags: { $in: [tag.name] },
          });
          const ticketCount = await tickets.countDocuments({
            tags: { $in: [tag.name] },
          });
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

  async deleteTag(tagId: string) {
    try {
      const tag = await this.tagModel.findOne({
        _id: tagId,
      });
      if (!tag) {
        throw new HttpException('Tag not found', 404);
      }
      await tag.remove();
      return tag;
    } catch (error) {
      this.logger.error(`Error deleting tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.tagModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments({
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
      title: 'Total Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async getDefaultCount(days = 30) {
    const total = await this.tagModel.countDocuments({
      type: TagTypesEnum.DEFAULT,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments({
        type: TagTypesEnum.DEFAULT,
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
      title: 'Default Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async getCustomCount(days = 30) {
    const total = await this.tagModel.countDocuments({
      type: TagTypesEnum.CUSTOM,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.tagModel.countDocuments({
        type: TagTypesEnum.CUSTOM,
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
      title: 'Custom Tags',
      subtitle: getDaySubtitle(days),
      type: 'tag',
    };
  }

  async stats(days = 30) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days),
        this.getDefaultCount(days),
        this.getCustomCount(days),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
