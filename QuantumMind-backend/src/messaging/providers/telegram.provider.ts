import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { ChannelEnum, ProviderIdEnum } from '../enums/channel.enum';
import {
  MessagingProvider,
  OutboundMessage,
  ProviderContext,
  ProviderFeature,
  SendResult,
} from '../interfaces/messaging-provider.interface';

/**
 * Telegram provider. Uses the Telegraf `ctx` stored in SocketStateService to
 * reply. Telegram supports native inline URL buttons, so cta_url maps cleanly.
 */
@Injectable()
export class TelegramProvider implements MessagingProvider {
  readonly channel = ChannelEnum.TELEGRAM;
  readonly providerId = ProviderIdEnum.TELEGRAM_OFFICIAL;
  readonly displayName = 'Telegram';
  readonly productionSafe = true;

  private readonly logger = new Logger(TelegramProvider.name);

  supportsFeature(feature: ProviderFeature): boolean {
    return ['text', 'media', 'buttons', 'cta_url'].includes(feature);
  }

  async sendMessage(
    _recipient: string,
    message: OutboundMessage,
    ctx: ProviderContext,
  ): Promise<SendResult> {
    try {
      if (!ctx?.reply) {
        return { status: 'failed', error: 'Telegram context not available' };
      }
      if (message.type === 'cta_url' && message.cta) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.url(message.cta.displayText, message.cta.url),
        ]);
        await ctx.reply(message.text || message.cta.displayText, keyboard);
      } else if (message.type === 'image') {
        await ctx.replyWithPhoto(message.mediaUrl);
      } else {
        await ctx.reply(message.text || '');
      }
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Telegram send failed: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
