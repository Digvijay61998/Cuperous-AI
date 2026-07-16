import { Global, Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { botsProviders } from './bots.provider';
@Global()
@Module({
  controllers: [BotsController],
  providers: [BotsService, ...botsProviders],
  exports: [BotsService],
})
export class BotsModule {}
