import { Module } from '@nestjs/common';
import { BaileysEngineService } from './baileys-engine.service';

/**
 * Leaf module exposing the in-process baileys engine. It has NO dependency on
 * the feature/message-handler layers (it talks outward via EventEmitter2 only),
 * so both the WhatsApp Web feature module and the messaging provider layer can
 * import it without creating a circular module graph.
 */
@Module({
  providers: [BaileysEngineService],
  exports: [BaileysEngineService],
})
export class WhatsappWebEngineModule {}
