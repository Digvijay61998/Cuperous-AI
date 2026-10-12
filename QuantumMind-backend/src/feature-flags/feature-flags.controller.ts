import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * Runtime feature flags (e.g. active messaging provider). Global flags affect
 * every tenant, so this is a platform-operator surface: SUPER_ADMIN only.
 * Org admins change their own bot-scoped provider via `/messaging`.
 */
@Controller('feature-flags')
@ApiTags('FeatureFlags')
@ApiSecurity('bearer')
@Roles(Role.SUPER_ADMIN)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  async list() {
    return this.featureFlagsService.listAll();
  }

  @Patch()
  async set(
    @Body()
    body: { key: string; value: any; scope?: 'global' | 'bot'; botId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!body?.key || typeof body.key !== 'string') {
      throw new BadRequestException('key is required');
    }
    const scope = body.scope === 'bot' ? 'bot' : 'global';
    if (scope === 'bot' && !body.botId) {
      throw new BadRequestException('botId is required for bot-scoped flags');
    }
    return this.featureFlagsService.setValue(
      body.key,
      body.value,
      scope,
      body.botId,
      user?._id,
    );
  }
}
