import { Injectable, Inject, Logger, HttpException } from '@nestjs/common';
import { CreateSocialDto } from './dto/create-social.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { SOCIAL_PROVIDER } from './constants';
import { SocialDocument } from './entities/social.entity';
import mongoose, { Model } from 'mongoose';
import { SocialPlatformEnumList } from './enums/social-platform.enum';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, randomBytes, scrypt, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  SocialStatusEnum,
  SocialStatusEnumList,
} from './enums/social-status.enum';
import { Telegraf } from 'telegraf';

import { SearchParamDto } from './dto/search-param.dto';
import { getDaySubtitle } from 'src/util/get-subtitle';
import { ComparisonDto } from 'src/util/comparison.dto';
import { ConversationDocument } from 'src/conversation/entities/conversation.entity';
import { ObjectId } from 'bson';
import { PlatformEnum } from 'src/conversation/enums/platform.enum';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  private readonly algorithm = 'aes-256-cbc';
  constructor(
    @Inject(SOCIAL_PROVIDER)
    private readonly socialModel: Model<SocialDocument>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private async encrypt(text: string) {
    const password = this.configService.get('encryption.key');
    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private async decrypt(text: string) {
    const password = this.configService.get('encryption.key');
    const [iv, encryptedText] = text.split(':');
    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  async create(createSocialDto: CreateSocialDto) {
    try {
      const social = await this.socialModel.create({
        ...createSocialDto,
        accessToken: await this.encrypt(createSocialDto.accessToken),
      });
      return social;
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query?: SearchParamDto) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        status,
        platform,
        bot,
      } = query;

      const queryObject = {};
      if (status) queryObject['status'] = status;
      if (platform) queryObject['platform'] = platform;
      if (bot) queryObject['jarcubeBot'] = bot;

      const social = this.socialModel
        .find(queryObject)
        .sort({ createdAt: -1 })
        .populate('jarcubeBot', 'name')
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        social.limit(limitOfDocuments);
      }
      const data = await social.exec();

      const count = await this.socialModel.countDocuments();
      const search = {
        platforms: SocialPlatformEnumList,
        status: SocialStatusEnumList,
      };
      return { data, count, search };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const social = await this.socialModel
        .findById(id)
        .populate('botId', 'name')
        .exec();
      if (!social) throw new HttpException('No Social Integration found', 404);
      return {
        ...social.toObject(),
        accessToken: await this.decrypt(social.accessToken),
      };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateSocialDto: UpdateSocialDto) {
    try {
      const social = await this.socialModel.findByIdAndUpdate(
        id,

        {
          ...updateSocialDto,
          accessToken:
            updateSocialDto.accessToken &&
            (await this.encrypt(updateSocialDto.accessToken)),
        },
        { new: true },
      );

      if (!social) throw new HttpException('No Social Integration found', 404);
      return social;
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const social = await this.socialModel.findByIdAndDelete(id);
      if (!social) throw new HttpException('No Social Integration found', 404);
      return social;
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      const social = await this.socialModel.findById(id);
      if (!social) throw new HttpException('No Social Integration found', 404);

      if (social.platform === 'telegram') {
        if (status === SocialStatusEnum.PUBLISHED) {
          await this.setTelegramWebhook(social.accessToken, social.botId);
        } else {
          await this.deleteTelegramWebhook(social.accessToken);
        }
      }

      social.status = status;
      await social.save();
    } catch (error) {
      this.logger.error(
        `Error while updating social integrations status : ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async setTelegramWebhook(accessToken: string, botId: string) {
    try {
      const decryptedAccessToken = await this.decrypt(accessToken);
      let url = `${this.configService.get(
        'social.telegram.baseUrl',
      )}${decryptedAccessToken}/setWebhook`;
      url = `${url}?url=${this.configService.get(
        'social.telegram.webhookUrl',
      )}/${botId}`;
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.description || error.message;
      this.logger.error(
        `Error while setting telegram webhook : ${errorMessage}`,
      );
      throw new HttpException(errorMessage, error.status || 500);
    }
  }

  async deleteTelegramWebhook(accessToken: string) {
    try {
      const decryptedAccessToken = await this.decrypt(accessToken);
      const url = `${this.configService.get(
        'social.telegram.baseUrl',
      )}${decryptedAccessToken}/deleteWebhook`;

      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotToken(botId: string) {
    try {
      const bot = await this.socialModel.findOne({ botId });
      if (!bot) return null;
      return {
        accessToken: await this.decrypt(bot.accessToken),
        jarcubeBotId: bot.jarcubeBot.toHexString(),
      };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new Error(error.message);
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.socialModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
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
      title: 'Total Social',
      subtitle: getDaySubtitle(days),
      type: 'social',
    };
  }

  async getPublishedCount(days = 30) {
    const total = await this.socialModel.countDocuments({
      status: SocialStatusEnum.PUBLISHED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
        status: SocialStatusEnum.PUBLISHED,
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
      title: 'Published Social',
      subtitle: getDaySubtitle(days),
      type: 'social',
    };
  }

  async getDraftCount(days = 30) {
    const total = await this.socialModel.countDocuments({
      status: SocialStatusEnum.DRAFT,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
        status: SocialStatusEnum.DRAFT,
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
      title: 'Draft Social',
      subtitle: getDaySubtitle(days),
      type: 'social',
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

  async dateWiseComparison(query: ComparisonDto) {
    try {
      const { param1, param2, startDate, endDate = new Date() } = query;

      const match = {};
      if (startDate && endDate) {
        match['createdAt'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (!startDate)
        match['createdAt'] = {
          $lte: new Date(endDate),
        };

      if (param1 && param2) {
        match['bot'] = {
          $in: [new ObjectId(param1), new ObjectId(param2)],
        };
      }
      const conversation = mongoose.model<ConversationDocument>('Conversation');
      const data = await conversation.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            param1: {
              $push: {
                $cond: {
                  if: {
                    $eq: ['$bot', new ObjectId(param1)],
                  },
                  then: {
                    platform: '$$ROOT.platform',
                  },
                  else: '$$REMOVE',
                },
              },
            },
            param2: {
              $push: {
                $cond: {
                  if: {
                    $eq: ['$bot', new ObjectId(param2)],
                  },
                  then: {
                    platform: '$$ROOT.platform',
                  },
                  else: '$$REMOVE',
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            bot1: {
              total: {
                $size: '$param1',
              },
              facebook: {
                $size: {
                  $filter: {
                    input: '$param1',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.platform', PlatformEnum.FACEBOOK],
                    },
                  },
                },
              },
              whatsapp: {
                $size: {
                  $filter: {
                    input: '$param1',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.WHATSAPP] },
                  },
                },
              },
              widget: {
                $size: {
                  $filter: {
                    input: '$param1',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.WIDGET] },
                  },
                },
              },
              telegram: {
                $size: {
                  $filter: {
                    input: '$param1',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.TELEGRAM] },
                  },
                },
              },
            },
            bot2: {
              total: {
                $size: '$param2',
              },
              facebook: {
                $size: {
                  $filter: {
                    input: '$param2',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.platform', PlatformEnum.FACEBOOK],
                    },
                  },
                },
              },
              whatsapp: {
                $size: {
                  $filter: {
                    input: '$param2',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.WHATSAPP] },
                  },
                },
              },
              widget: {
                $size: {
                  $filter: {
                    input: '$param2',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.WIDGET] },
                  },
                },
              },
              telegram: {
                $size: {
                  $filter: {
                    input: '$param2',
                    as: 'item',
                    cond: { $eq: ['$$item.platform', PlatformEnum.TELEGRAM] },
                  },
                },
              },
            },
          },
        },
      ]);

      return data;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
