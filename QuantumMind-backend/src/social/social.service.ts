import {
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import {
  assertOwnership,
  scopedFilter,
  TenantContext,
} from 'src/common/tenant/tenant-context';
import { EntitlementService } from 'src/billing/entitlement.service';
import { PLATFORM_FEATURE } from './social-features';
import { CreateSocialDto } from './dto/create-social.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { SOCIAL_PROVIDER } from './constants';
import { SocialDocument } from './entities/social.entity';
import mongoose, { Model } from 'mongoose';
import { SocialPlatformEnum, SocialPlatformEnumList } from './enums/social-platform.enum';
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
    private readonly tenantScope: TenantScopeService,
    private readonly entitlementService: EntitlementService,
  ) {}

  /** Never return a stored access token (even encrypted) in list/update views. */
  private redact(doc: any) {
    const obj = doc?.toObject ? doc.toObject() : { ...(doc ?? {}) };
    delete obj.accessToken;
    return obj;
  }

  /**
   * Resolves the org that will own a platform connection from its JarCube bot
   * (must be in the caller's org), and enforces the platform's feature gate.
   */
  async resolveConnectionOrg(
    user: TenantContext,
    platform: string,
    jarcubeBot: any,
  ): Promise<string> {
    const feature = PLATFORM_FEATURE[platform];
    if (!feature) {
      throw new ForbiddenException(
        `Connecting '${platform}' is not supported`,
      );
    }
    if (!jarcubeBot) {
      throw new HttpException('jarcubeBot is required', 400);
    }
    const bot = await this.tenantScope.assertBotInOrg(user, jarcubeBot);
    const orgId = bot.organizationId ? String(bot.organizationId) : null;
    if (!orgId) throw new NotFoundException('Bot not found');
    if (!(await this.entitlementService.isFeatureEnabled(orgId, feature))) {
      throw new ForbiddenException(
        `The '${feature}' feature is not enabled for your organization`,
      );
    }
    return orgId;
  }

  /** Loads a connection and asserts the caller's org owns it (404 otherwise). */
  private async requireOwned(id: string, user?: TenantContext) {
    if (!mongoose.isValidObjectId(id)) {
      throw new HttpException('No Social Integration found', 404);
    }
    const social = await this.socialModel.findById(id);
    if (!social) throw new HttpException('No Social Integration found', 404);
    if (user) {
      try {
        assertOwnership(user, social as any);
      } catch {
        throw new HttpException('No Social Integration found', 404);
      }
    }
    return social;
  }

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

  /**
   * Connects a token-based platform (WhatsApp Official, Telegram, Facebook).
   * The org is derived from the linked bot, the platform must be enabled for
   * the org, and one `maxPlatforms` slot is reserved atomically (released if
   * the insert fails).
   */
  async create(createSocialDto: CreateSocialDto, user: TenantContext) {
    try {
      if (createSocialDto.platform === SocialPlatformEnum.WHATSAPP_WEB) {
        throw new HttpException(
          'WhatsApp Web sessions are created via /whatsapp-web/sessions',
          400,
        );
      }
      const organizationId = await this.resolveConnectionOrg(
        user,
        createSocialDto.platform,
        createSocialDto.jarcubeBot,
      );
      if (
        createSocialDto.botId &&
        (await this.socialModel.exists({
          platform: createSocialDto.platform,
          botId: createSocialDto.botId,
        }))
      ) {
        // Inbound routing resolves by (platform) botId; a duplicate would let a
        // second tenant capture the first tenant's traffic.
        throw new HttpException('This platform account is already connected', 409);
      }

      await this.entitlementService.reserveQuota(organizationId, 'platform');
      try {
        const social = await this.socialModel.create({
          name: createSocialDto.name,
          platform: createSocialDto.platform,
          botId: createSocialDto.botId,
          jarcubeBot: createSocialDto.jarcubeBot,
          organizationId,
          accessToken: await this.encrypt(createSocialDto.accessToken),
        });
        return this.redact(social);
      } catch (error) {
        await this.entitlementService.releaseQuota(organizationId, 'platform');
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error creating social: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: SearchParamDto = {} as any, user?: TenantContext) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        status,
        platform,
        bot,
      } = query;

      const queryObject: Record<string, any> = {};
      if (status) queryObject['status'] = status;
      if (platform) queryObject['platform'] = platform;
      if (bot) queryObject['jarcubeBot'] = bot;
      const scoped = scopedFilter(user, queryObject);

      const social = this.socialModel
        .find(scoped)
        .select('-accessToken')
        .sort({ createdAt: -1 })
        .populate('jarcubeBot', 'name')
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        social.limit(limitOfDocuments);
      }
      const data = await social.exec();

      const count = await this.socialModel.countDocuments(scoped);
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

  /**
   * One connection. The decrypted token is only returned to ORG_ADMIN (it is a
   * live credential for the customer's channel account); everyone else gets it
   * redacted.
   */
  async findOne(id: string, user?: TenantContext) {
    try {
      const social = await this.requireOwned(id, user);
      const obj = social.toObject();
      if (user && user.role !== 'org_admin') {
        delete obj.accessToken;
        return obj;
      }
      return {
        ...obj,
        accessToken: social.accessToken
          ? await this.decrypt(social.accessToken)
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateSocialDto: UpdateSocialDto, user?: TenantContext) {
    try {
      const existing = await this.requireOwned(id, user);
      const changes: Record<string, any> = {};
      if (updateSocialDto.name !== undefined) changes.name = updateSocialDto.name;
      if (updateSocialDto.botId !== undefined) changes.botId = updateSocialDto.botId;
      if (updateSocialDto.accessToken) {
        changes.accessToken = await this.encrypt(updateSocialDto.accessToken);
      }
      // Platform and status are not editable here (status goes through
      // update-status, which also toggles the channel webhook).
      if (
        updateSocialDto.jarcubeBot &&
        String(updateSocialDto.jarcubeBot) !== String(existing.jarcubeBot)
      ) {
        const bot = await this.tenantScope.assertBotInOrg(
          user,
          updateSocialDto.jarcubeBot,
        );
        if (
          String(bot.organizationId ?? '') !==
          String(existing.organizationId ?? '')
        ) {
          throw new HttpException('No Social Integration found', 404);
        }
        changes.jarcubeBot = updateSocialDto.jarcubeBot;
      }
      if (
        changes.botId &&
        (await this.socialModel.exists({
          _id: { $ne: existing._id },
          platform: existing.platform,
          botId: changes.botId,
        }))
      ) {
        throw new HttpException('This platform account is already connected', 409);
      }

      const social = await this.socialModel.findByIdAndUpdate(
        existing._id,
        changes,
        { new: true },
      );

      if (!social) throw new HttpException('No Social Integration found', 404);
      return this.redact(social);
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string, user?: TenantContext) {
    try {
      const existing = await this.requireOwned(id, user);
      if (existing.platform === SocialPlatformEnum.WHATSAPP_WEB) {
        throw new HttpException(
          'Delete WhatsApp Web sessions via /whatsapp-web/sessions/:id',
          400,
        );
      }
      if (
        existing.platform === SocialPlatformEnum.TELEGRAM &&
        existing.status === SocialStatusEnum.PUBLISHED &&
        existing.accessToken
      ) {
        await this.deleteTelegramWebhook(existing.accessToken).catch(() => undefined);
      }
      const social = await this.socialModel.findByIdAndDelete(existing._id);
      if (!social) throw new HttpException('No Social Integration found', 404);
      await this.entitlementService.releaseQuota(
        social.organizationId ? String(social.organizationId) : null,
        'platform',
      );
      return this.redact(social);
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateStatus(id: string, status: string, user?: TenantContext) {
    try {
      const social = await this.requireOwned(id, user);
      // Publishing re-checks the feature: a plan downgrade must stop new
      // activations even for connections created earlier.
      if (
        status === SocialStatusEnum.PUBLISHED &&
        PLATFORM_FEATURE[social.platform] &&
        social.organizationId &&
        !(await this.entitlementService.isFeatureEnabled(
          String(social.organizationId),
          PLATFORM_FEATURE[social.platform],
        ))
      ) {
        throw new ForbiddenException(
          `The '${PLATFORM_FEATURE[social.platform]}' feature is not enabled for your organization`,
        );
      }

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

  async getTotalCount(days = 30, user?: TenantContext) {
    const scope = scopedFilter(user, {});
    const total = await this.socialModel.countDocuments(scope);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
        ...scope,
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

  async getPublishedCount(days = 30, user?: TenantContext) {
    const scope = scopedFilter(user, {});
    const total = await this.socialModel.countDocuments({
      ...scope,
      status: SocialStatusEnum.PUBLISHED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
        ...scope,
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

  async getDraftCount(days = 30, user?: TenantContext) {
    const scope = scopedFilter(user, {});
    const total = await this.socialModel.countDocuments({
      ...scope,
      status: SocialStatusEnum.DRAFT,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.socialModel.countDocuments({
        ...scope,
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

  async dateWiseComparison(query: ComparisonDto, user?: TenantContext) {
    try {
      const { param1, param2, startDate, endDate = new Date() } = query;
      // Both compared bots must belong to the caller's org.
      for (const b of [param1, param2]) {
        if (b && !mongoose.isValidObjectId(b)) return [];
        if (b && user && !(await this.tenantScope.isBotInOrg(user, b))) {
          return [];
        }
      }
      if (!param1 || !param2) return [];

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

  // ==========================================================================
  // WhatsApp Web (baileys) helpers
  //
  // The WhatsApp Web platform has no access token (it links via QR / phone
  // pairing), so it bypasses the encrypt-on-create path used by the token-based
  // platforms. The Social row here is just the list representation of a session
  // that the WhatsappWebModule owns; status flips to `published` on connect.
  // ==========================================================================

  async createWhatsappWebSocial(data: {
    name: string;
    jarcubeBot: string;
    organizationId?: string | null;
  }) {
    try {
      const social = await this.socialModel.create({
        name: data.name,
        platform: SocialPlatformEnum.WHATSAPP_WEB,
        jarcubeBot: data.jarcubeBot,
        organizationId: data.organizationId ?? null,
        status: SocialStatusEnum.DRAFT,
      });
      return social;
    } catch (error) {
      this.logger.error(`Error creating WhatsApp Web social: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async setStatusById(id: string, status: string) {
    try {
      return await this.socialModel.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );
    } catch (error) {
      this.logger.error(`Error updating social status: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateWhatsappWebMeta(
    id: string,
    data: { sessionId?: string; sessionStatus?: string; status?: string },
  ) {
    try {
      return await this.socialModel.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      this.logger.error(`Error updating WhatsApp Web social meta: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async deleteById(id: string) {
    try {
      return await this.socialModel.findByIdAndDelete(id);
    } catch (error) {
      this.logger.error(`Error deleting social: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
