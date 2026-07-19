import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { FeatureFlagsService } from 'src/feature-flags/feature-flags.service';
import { ChannelEnumList } from './enums/channel.enum';
import { MessagingProviderRegistry } from './messaging-provider.registry';

/**
 * Admin-facing endpoints powering the provider-toggle UI (#4/#6).
 * Lets an admin see every registered provider per channel and switch the active
 * one (e.g. WhatsApp Official <-> OpenWA) at runtime with no redeploy.
 */
@Controller('messaging')
@ApiTags('Messaging')
@ApiSecurity('bearer')
export class MessagingController {
  constructor(
    private readonly registry: MessagingProviderRegistry,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  @Get('providers')
  async listProviders() {
    const byChannel = this.registry.listByChannel();
    const channels = await Promise.all(
      ChannelEnumList.map(async (channel) => ({
        channel,
        active: await this.featureFlags.getActiveProvider(channel),
        providers: byChannel[channel] || [],
      })),
    );
    return { channels };
  }

  @Patch('providers/:channel/active')
  async setActive(
    @Param('channel') channel: string,
    @Body() body: { providerId: string; botId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.featureFlags.setActiveProvider(
      channel,
      body.providerId,
      body.botId,
      user?._id,
    );
    return {
      channel,
      active: await this.featureFlags.getActiveProvider(channel, body.botId),
    };
  }
}
