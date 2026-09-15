import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagsService } from 'src/feature-flags/feature-flags.service';
import { DEFAULT_PROVIDER_BY_CHANNEL, ProviderIdEnum } from './enums/channel.enum';
import { MessagingProvider } from './interfaces/messaging-provider.interface';

/**
 * Platforms whose transport is fixed and must NOT follow the channel feature
 * flag. A conversation that arrived on the self-linked WhatsApp Web session has
 * to be answered on that same session — routing it to the official Cloud API
 * provider would send from a different number (or fail outright).
 *
 * These are PlatformEnum values, which are finer-grained than ChannelEnum:
 * `whatsapp_web` is not a channel, so without this map `resolve()` found no
 * provider and callers silently degraded to a link-less text message.
 */
const PINNED_PROVIDER_BY_PLATFORM: Record<string, string> = {
  whatsapp_web: ProviderIdEnum.WHATSAPP_OPENWA,
};

/**
 * Central registry of all messaging providers. Providers self-register on
 * construction. The workflow engine calls `resolve(channel, botId)` and gets
 * back whichever provider the feature flag currently points at — it never
 * references a concrete provider class.
 */
@Injectable()
export class MessagingProviderRegistry {
  private readonly logger = new Logger(MessagingProviderRegistry.name);
  private readonly providers = new Map<string, MessagingProvider>();

  constructor(private readonly featureFlags: FeatureFlagsService) {}

  register(provider: MessagingProvider) {
    this.providers.set(provider.providerId, provider);
    this.logger.log(
      `Registered messaging provider: ${provider.providerId} (${provider.channel})`,
    );
  }

  /** Resolve the active provider for a channel, honouring the feature flag. */
  async resolve(channel: string, botId?: string): Promise<MessagingProvider | null> {
    const pinnedId = PINNED_PROVIDER_BY_PLATFORM[channel];
    if (pinnedId) {
      const pinned = this.providers.get(pinnedId);
      if (pinned) return pinned;
      this.logger.warn(
        `Provider ${pinnedId} pinned for platform ${channel} is not registered`,
      );
      return null;
    }

    const providerId = await this.featureFlags.getActiveProvider(channel, botId);
    const provider =
      this.providers.get(providerId) ||
      this.providers.get(DEFAULT_PROVIDER_BY_CHANNEL[channel]);
    if (!provider) {
      this.logger.warn(`No provider registered for channel ${channel}`);
      return null;
    }
    return provider;
  }

  getById(providerId: string): MessagingProvider | undefined {
    return this.providers.get(providerId);
  }

  /** All registered providers grouped by channel, for the admin toggle UI. */
  listByChannel(): Record<string, { providerId: string; displayName: string; productionSafe: boolean }[]> {
    const out: Record<string, any[]> = {};
    for (const p of this.providers.values()) {
      out[p.channel] = out[p.channel] || [];
      out[p.channel].push({
        providerId: p.providerId,
        displayName: p.displayName,
        productionSafe: p.productionSafe,
      });
    }
    return out;
  }
}
