import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { FeatureFlagsService } from './feature-flags.service';

@Controller('feature-flags')
@ApiTags('FeatureFlags')
@ApiSecurity('bearer')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  async list() {
    return this.featureFlagsService.listAll();
  }

  @Patch()
  async set(
    @Body() body: { key: string; value: any; scope?: 'global' | 'bot'; botId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.featureFlagsService.setValue(
      body.key,
      body.value,
      body.scope || 'global',
      body.botId,
      user?._id,
    );
  }
}
