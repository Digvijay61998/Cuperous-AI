import { Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagProviders } from './feature-flag.provider';

@Module({
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, ...FeatureFlagProviders],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
