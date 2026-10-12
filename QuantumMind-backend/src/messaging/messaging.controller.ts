import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { FeatureFlagsService } from 'src/feature-flags/feature-flags.service';
import { ChannelEnumList } from './enums/channel.enum';
import { MessagingProviderRegistry } from './messaging-provider.registry';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';

/**
 * Provider-toggle UI (Channel Providers tab).
 *
 * The GLOBAL provider for a channel affects every tenant, so only a
 * SUPER_ADMIN may change it. An ORG_ADMIN may only switch the provider for a
 * specific bot of their own organization (bot-scoped flag).
 */
@Controller('messaging')
@ApiTags('Messaging')
@ApiSecurity('bearer')
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
export class MessagingController {
  constructor(
    private readonly registry: MessagingProviderRegistry,
    private readonly featureFlags: FeatureFlagsService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Get('providers')
  async listProviders(
    @Query('botId') botId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (botId) await this.tenantScope.assertBotInOrg(user as any, botId);
    const byChannel = this.registry.listByChannel();
    const channels = await Promise.all(
      ChannelEnumList.map(async (channel) => ({
        channel,
        active: await this.featureFlags.getActiveProvider(channel, botId),
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
    if (!ChannelEnumList.includes(channel as any)) {
      throw new BadRequestException(`Unknown channel '${channel}'`);
    }
    const known = (this.registry.listByChannel()[channel] || []).some(
      (p) => p.providerId === body?.providerId,
    );
    if (!known) {
      throw new BadRequestException(
        `Unknown provider '${body?.providerId}' for channel '${channel}'`,
      );
    }
    if (user.role !== Role.SUPER_ADMIN) {
      if (!body?.botId) {
        throw new BadRequestException(
          'botId is required: organization admins can only change the provider for their own bots',
        );
      }
      await this.tenantScope.assertBotInOrg(user as any, body.botId);
    }
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
