import { Global, Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { BotsModule } from 'src/bots/bots.module';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  providers: [WidgetService],
  controllers: [WidgetController],
  imports: [BotsModule, HttpModule.register({})],
})
export class WidgetModule {}
