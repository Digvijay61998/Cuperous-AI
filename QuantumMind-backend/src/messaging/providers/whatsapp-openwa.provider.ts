import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
 * OpenWA provider — talks to a self-hosted OpenWA gateway
 * (github.com/rmyndharis/OpenWA) which drives WhatsApp via the UNOFFICIAL
 * whatsapp-web.js/baileys protocol.
 *
 * WARNING: This automates a personal WhatsApp Web session. It violates
 * WhatsApp's Terms of Service and carries a real risk of the number being
 * banned. It exists ONLY as a development/QA provider so workflow logic can be
 * tested end-to-end before official Cloud API verification completes. It refuses
 * to run in production unless the operator explicitly opts in for a throwaway
 * number (WHATSAPP_ALLOW_OPENWA_PROD=true).
 */
@Injectable()
export class WhatsappOpenWaProvider implements MessagingProvider, OnModuleInit {
  readonly channel = ChannelEnum.WHATSAPP;
  readonly providerId = ProviderIdEnum.WHATSAPP_OPENWA;
  readonly displayName = 'WhatsApp (OpenWA — dev/testing only)';
  readonly productionSafe = false;

  private readonly logger = new Logger(WhatsappOpenWaProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    const env = this.configService.get('app.env') || process.env.NODE_ENV;
    const allowInProd =
      this.configService.get('whatsapp.allowOpenWaInProd') === true ||
      process.env.WHATSAPP_ALLOW_OPENWA_PROD === 'true';
    if (env === 'production' && !allowInProd) {
      this.logger.error(
        'WhatsappOpenWaProvider is registered in a production environment. ' +
          'OpenWA is UNOFFICIAL and risks number bans. It will refuse to send ' +
          'unless WHATSAPP_ALLOW_OPENWA_PROD=true is explicitly set.',
      );
    }
  }

  supportsFeature(feature: ProviderFeature): boolean {
    // whatsapp-web.js cannot send native cta_url interactive buttons — the URL
    // is sent as plain text instead (see sendMessage fallback).
    return ['text', 'media'].includes(feature);
  }

  private get baseUrl(): string {
    return (
      this.configService.get('whatsapp.openwa.baseUrl') ||
      'http://localhost:2785/api'
    );
  }
  private get apiKey(): string {
    return this.configService.get('whatsapp.openwa.apiKey') || '';
  }
  private get sessionId(): string {
    return this.configService.get('whatsapp.openwa.sessionId') || 'default';
  }

  private guardProduction(): SendResult | null {
    const env = this.configService.get('app.env') || process.env.NODE_ENV;
    const allowInProd =
      this.configService.get('whatsapp.allowOpenWaInProd') === true ||
      process.env.WHATSAPP_ALLOW_OPENWA_PROD === 'true';
    if (env === 'production' && !allowInProd) {
      return {
        status: 'failed',
        error:
          'OpenWA is disabled in production. Set WHATSAPP_ALLOW_OPENWA_PROD=true to override (not recommended).',
      };
    }
    return null;
  }

  async sendMessage(
    recipient: string,
    message: OutboundMessage,
    _ctx: ProviderContext,
  ): Promise<SendResult> {
    const blocked = this.guardProduction();
    if (blocked) return blocked;

    try {
      // OpenWA chatId format: <number>@c.us
      const chatId = recipient.includes('@')
        ? recipient
        : `${recipient.replace(/\D/g, '')}@c.us`;

      let text = message.text || '';
      if (message.type === 'cta_url' && message.cta) {
        // No native CTA button — degrade to a labelled link.
        text = `${message.cta.displayText}: ${message.cta.url}`;
      }

      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/sessions/${this.sessionId}/messages/send-text`,
          { chatId, text },
          { headers: { 'X-API-Key': this.apiKey } },
        ),
      );
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`OpenWA send failed: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
