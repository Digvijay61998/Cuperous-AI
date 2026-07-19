import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagsService } from 'src/feature-flags/feature-flags.service';
import { DEFAULT_PROVIDER_BY_CHANNEL } from './enums/channel.enum';
import { MessagingProvider } from './interfaces/messaging-provider.interface';

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
