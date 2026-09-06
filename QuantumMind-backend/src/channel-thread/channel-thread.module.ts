import { Global, Module } from '@nestjs/common';
import { channelThreadProvider } from './channel-thread.provider';
import { ChannelThreadService } from './channel-thread.service';

/**
 * Channel threads are consumed by every inbound channel hub (WhatsApp Web today;
 * Telegram/Facebook/Instagram next) and by the conversation/inbox layer.
 * @Global mirrors ConversationModule so those consumers do not each have to
 * import it and risk a circular module graph.
 */
@Global()
@Module({
  providers: [...channelThreadProvider, ChannelThreadService],
  exports: [ChannelThreadService],
})
export class ChannelThreadModule {}
