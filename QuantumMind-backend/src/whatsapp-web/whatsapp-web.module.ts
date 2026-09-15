import { Module } from '@nestjs/common';
import { SocialModule } from 'src/social/social.module';
import { WhatsappWebEngineModule } from './engine/whatsapp-web-engine.module';
import { whatsappWebProviders } from './whatsapp-web-session.provider';
import { WhatsappWebController } from './whatsapp-web.controller';
import { WhatsappWebService } from './whatsapp-web.service';
import { WhatsappWebInboundService } from './whatsapp-web-inbound.service';
import { WhatsappWebRateLimiter } from './whatsapp-web-rate-limiter';

/**
 * WhatsApp Web (baileys) feature module: session CRUD + lifecycle, inbound
 * routing into the bot, and outbound delivery. Depends on the leaf engine
 * module and SocialModule; the message-handler / socket / chat-initializer
 * services are provided by their @Global modules.
 */
@Module({
  imports: [WhatsappWebEngineModule, SocialModule],
  controllers: [WhatsappWebController],
  providers: [
    ...whatsappWebProviders,
    WhatsappWebService,
    WhatsappWebInboundService,
    WhatsappWebRateLimiter,
  ],
  exports: [WhatsappWebService],
})
export class WhatsappWebModule {}
