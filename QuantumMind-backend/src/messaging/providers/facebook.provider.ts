import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ChannelEnum, ProviderIdEnum } from '../enums/channel.enum';
import {
  MessagingProvider,
  OutboundMessage,
  ProviderContext,
  ProviderFeature,
  SendResult,
} from '../interfaces/messaging-provider.interface';

/**
 * Facebook Messenger provider. Uses the ctx ({ sender_psid, accessToken })
 * stored in SocketStateService. cta_url maps to a button-template web_url button.
 */
@Injectable()
export class FacebookProvider implements MessagingProvider {
  readonly channel = ChannelEnum.FACEBOOK;
  readonly providerId = ProviderIdEnum.FACEBOOK_OFFICIAL;
  readonly displayName = 'Facebook Messenger';
  readonly productionSafe = true;

  private readonly logger = new Logger(FacebookProvider.name);

  constructor(private readonly httpService: HttpService) {}

  supportsFeature(feature: ProviderFeature): boolean {
    return ['text', 'media', 'buttons', 'cta_url'].includes(feature);
  }

  async sendMessage(
    _recipient: string,
    message: OutboundMessage,
    ctx: ProviderContext,
  ): Promise<SendResult> {
    try {
      if (!ctx?.sender_psid || !ctx?.accessToken) {
        return { status: 'failed', error: 'Facebook context not available' };
      }

      let messagePayload: any;
      if (message.type === 'cta_url' && message.cta) {
        messagePayload = {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: message.text || message.cta.displayText,
              buttons: [
                {
                  type: 'web_url',
                  title: message.cta.displayText,
                  url: message.cta.url,
                },
              ],
            },
          },
        };
      } else if (message.type === 'image') {
        messagePayload = {
          attachment: { type: 'image', payload: { url: message.mediaUrl } },
        };
      } else {
        messagePayload = { text: message.text || '' };
      }

      await firstValueFrom(
        this.httpService.post(
          'https://graph.facebook.com/v15.0/me/messages',
          { recipient: { id: ctx.sender_psid }, message: messagePayload },
          { params: { access_token: ctx.accessToken } },
        ),
      );
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Facebook send failed: ${error.response?.data?.error?.message || error.message}`,
      );
      return { status: 'failed', error: error.message };
    }
  }
}
