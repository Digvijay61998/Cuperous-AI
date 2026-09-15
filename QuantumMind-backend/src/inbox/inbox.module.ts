import { Global, Module } from '@nestjs/common';
import { InboxEventsService } from './inbox-events.service';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

/**
 * Omnichannel inbox: read API (InboxService) + realtime fan-out
 * (InboxEventsService).
 *
 * Imports nothing: ConversationModule, ChannelThreadModule, AgentModule and
 * RedisPropagateModule are all @Global, and the channel hubs are reached through
 * EventEmitter2 rather than by importing an engine. That is what keeps this
 * module channel-agnostic — adding Telegram or Instagram needs no change here.
 *
 * @Global because the channel hubs (WhatsApp Web today) need InboxEventsService
 * to announce a message. Marking it global rather than having each hub import
 * InboxModule avoids closing a cycle: those hubs already listen for
 * InboxService's events, so a two-way module import would complete the loop.
 */
@Global()
@Module({
  controllers: [InboxController],
  providers: [InboxService, InboxEventsService],
  exports: [InboxService, InboxEventsService],
})
export class InboxModule {}
