import { Global, Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { webhookProviders } from './webhook.provider';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  controllers: [WebhookController],
  providers: [WebhookService, ...webhookProviders],
  exports: [WebhookService],
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
  ],
})
export class WebhookModule {}
