import { Injectable, Logger } from '@nestjs/common';
import { ChannelEnum, ProviderIdEnum } from '../enums/channel.enum';
import { BaileysEngineService } from 'src/whatsapp-web/engine/baileys-engine.service';
import {
  MessagingProvider,
  OutboundMessage,
  ProviderContext,
  ProviderFeature,
  SendResult,
} from '../interfaces/messaging-provider.interface';

/**
 * WhatsApp Web provider — drives WhatsApp through the NATIVE in-process baileys
 * engine (ported from OpenWA). Previously this called a self-hosted OpenWA
 * gateway over HTTP; it now sends directly via {@link BaileysEngineService}, so
 * no external service is required.
 *
 * The session to send from is carried on the conversation context
 * (`ctx.whatsappWeb.sessionName`), set when the inbound message was routed.
 *
 * WARNING: this automates a personal WhatsApp Web session (unofficial protocol)
 * and carries a real risk of the number being banned. It is intended for the
 * self-linked numbers managed under Social Messengers → WhatsApp Web.
 */
@Injectable()
export class WhatsappOpenWaProvider implements MessagingProvider {
  readonly channel = ChannelEnum.WHATSAPP;
  readonly providerId = ProviderIdEnum.WHATSAPP_OPENWA;
  readonly displayName = 'WhatsApp Web (baileys — self-linked number)';
  readonly productionSafe = false;

  private readonly logger = new Logger(WhatsappOpenWaProvider.name);

  constructor(private readonly engine: BaileysEngineService) {}

  supportsFeature(feature: ProviderFeature): boolean {
    // No reliable native interactive buttons; URLs/buttons degrade to text.
    return ['text', 'media'].includes(feature);
  }

  async sendMessage(
    recipient: string,
    message: OutboundMessage,
    ctx: ProviderContext,
  ): Promise<SendResult> {
    const sessionName = ctx?.whatsappWeb?.sessionName;
    const to = ctx?.whatsappWeb?.recipient || recipient;
    if (!sessionName) {
      return {
        status: 'failed',
        error: 'No WhatsApp Web session in context (ctx.whatsappWeb.sessionName)',
      };
    }

    try {
      if (message.type === 'image' && message.mediaUrl) {
        await this.engine.sendImage(sessionName, to, message.mediaUrl, message.caption);
        return { status: 'success' };
      }

      let text = message.text || '';
      if (message.type === 'cta_url' && message.cta) {
        text = `${message.cta.displayText}: ${message.cta.url}`;
      }
      if (!text) {
        return { status: 'failed', error: 'Empty message' };
      }
      await this.engine.sendText(sessionName, to, text);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`WhatsApp Web send failed: ${error?.message}`);
      return { status: 'failed', error: error?.message };
    }
  }
}
