import { Global, Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { botsProviders } from './bots.provider';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
@Global()
@Module({
  controllers: [BotsController],
  providers: [BotsService, TenantScopeService, ...botsProviders],
  exports: [BotsService, TenantScopeService],
})
export class BotsModule {}
