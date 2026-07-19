import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { FEATURE_FLAG_PROVIDER, FLAG_KEYS } from './constant';
import { FeatureFlagDocument } from './entities/feature-flag.entity';
import {
  DEFAULT_PROVIDER_BY_CHANNEL,
} from 'src/messaging/enums/channel.enum';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    @Inject(FEATURE_FLAG_PROVIDER)
    private readonly flagModel: Model<FeatureFlagDocument>,
  ) {}

  /** Raw flag lookup: bot-scoped override first, then global. */
  async getValue(key: string, botId?: string): Promise<any> {
    if (botId) {
      const botFlag = await this.flagModel.findOne({ scope: 'bot', key, botId });
      if (botFlag) return botFlag.value;
    }
    const globalFlag = await this.flagModel.findOne({ scope: 'global', key, botId: null });
    return globalFlag ? globalFlag.value : undefined;
  }

  /** Upsert a flag value. */
  async setValue(
    key: string,
    value: any,
    scope: 'global' | 'bot' = 'global',
    botId?: string,
    updatedBy?: string,
  ) {
    try {
      return await this.flagModel.findOneAndUpdate(
        { scope, key, botId: scope === 'bot' ? botId : null },
        { value, updatedBy: updatedBy || null },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      this.logger.error(`Error setting flag ${key}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Resolves the active messaging provider id for a channel, falling back to
   * the channel's compiled-in default when no flag is set.
   */
  async getActiveProvider(channel: string, botId?: string): Promise<string> {
    const flagged = await this.getValue(FLAG_KEYS.providerFor(channel), botId);
    return flagged || DEFAULT_PROVIDER_BY_CHANNEL[channel];
  }

  async setActiveProvider(
    channel: string,
    providerId: string,
    botId?: string,
    updatedBy?: string,
  ) {
    return this.setValue(
      FLAG_KEYS.providerFor(channel),
      providerId,
      botId ? 'bot' : 'global',
      botId,
      updatedBy,
    );
  }

  async listAll() {
    return this.flagModel.find().sort({ key: 1 });
  }
}
