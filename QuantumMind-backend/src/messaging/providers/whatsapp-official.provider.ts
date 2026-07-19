import { Injectable, Logger } from '@nestjs/common';
import { ChannelEnum, ProviderIdEnum } from '../enums/channel.enum';
import {
  MessagingProvider,
  OutboundMessage,
  ProviderContext,
  ProviderFeature,
  SendResult,
} from '../interfaces/messaging-provider.interface';

/**
 * Official WhatsApp Cloud API provider. Reuses the WhatsappCloud instance that
 * the inbound webhook already initialised and stored in SocketStateService.ctx
 * (ctx.Whatsapp), so no token re-fetch is needed on the outbound path.
 */
@Injectable()
export class WhatsappOfficialProvider implements MessagingProvider {
  readonly channel = ChannelEnum.WHATSAPP;
  readonly providerId = ProviderIdEnum.WHATSAPP_OFFICIAL;
  readonly displayName = 'WhatsApp (Official Cloud API)';
  readonly productionSafe = true;

  private readonly logger = new Logger(WhatsappOfficialProvider.name);

  supportsFeature(feature: ProviderFeature): boolean {
    return ['text', 'media', 'buttons', 'cta_url'].includes(feature);
  }

  async sendMessage(
    recipient: string,
    message: OutboundMessage,
    ctx: ProviderContext,
  ): Promise<SendResult> {
    try {
      const whatsapp = ctx?.Whatsapp;
      const recipientPhone = recipient || ctx?.recipient;
      if (!whatsapp || !recipientPhone) {
        return { status: 'failed', error: 'WhatsApp context not initialised' };
      }

      switch (message.type) {
        case 'cta_url':
          await whatsapp.sendCtaUrl({
            recipientPhone,
            bodyText: message.text || message.cta?.displayText || ' ',
            buttonText: message.cta?.displayText || 'Open',
            url: message.cta?.url,
          });
          break;
        case 'image':
          await whatsapp.sendImage({
            recipientPhone,
            url: message.mediaUrl,
            caption: message.caption,
          });
          break;
        case 'text':
        default:
          await whatsapp.sendText({ recipientPhone, message: message.text });
          break;
      }
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`WhatsApp official send failed: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
