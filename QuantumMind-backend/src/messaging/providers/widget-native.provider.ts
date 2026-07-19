import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChannelEnum, ProviderIdEnum } from '../enums/channel.enum';
import {
  MessagingProvider,
  OutboundMessage,
  ProviderContext,
  ProviderFeature,
  SendResult,
} from '../interfaces/messaging-provider.interface';

/**
 * Web Widget provider. Unlike push channels, the widget delivers messages over
 * an open Socket.IO connection. To avoid a circular dependency on the socket
 * layer, this provider emits an event that MessageHandlerService listens for
 * and routes through its existing RedisPropagator socket path.
 *
 * The widget is the one channel that can render a template in a real embedded
 * iframe/modal, so cta_url is delivered as a structured payload the widget
 * front-end can open inline.
 */
@Injectable()
export class WidgetNativeProvider implements MessagingProvider {
  readonly channel = ChannelEnum.WIDGET;
  readonly providerId = ProviderIdEnum.WIDGET_NATIVE;
  readonly displayName = 'Web Widget';
  readonly productionSafe = true;

  private readonly logger = new Logger(WidgetNativeProvider.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  supportsFeature(feature: ProviderFeature): boolean {
    return ['text', 'media', 'buttons', 'cta_url'].includes(feature);
  }

  async sendMessage(
    recipient: string,
    message: OutboundMessage,
    _ctx: ProviderContext,
  ): Promise<SendResult> {
    try {
      // recipient is the visitor/userId for the widget channel.
      this.eventEmitter.emit('messaging.widget.send', {
        userId: recipient,
        message,
      });
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Widget send failed: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
