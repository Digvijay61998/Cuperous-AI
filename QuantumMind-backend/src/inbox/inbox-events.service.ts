import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';
import { InboxMessageView, InboxThreadView } from './inbox.mapper';

/** Socket events the dashboard inbox subscribes to. */
export const INBOX_SOCKET_MESSAGE = 'inbox:message';
export const INBOX_SOCKET_THREAD_UPDATED = 'inbox:thread-updated';
export const INBOX_SOCKET_MESSAGE_STATUS = 'inbox:message-status';
export const INBOX_SOCKET_CHANNELS_CHANGED = 'inbox:channels-changed';

/**
 * Realtime fan-out for the omnichannel inbox.
 *
 * WHY THIS GOES THROUGH RedisPropagatorService AND NOT socket.io ROOMS
 * -------------------------------------------------------------------
 * A room per bot is the obvious design and it is WRONG for this codebase.
 * `@socket.io/redis-adapter` is not installed, so socket.io rooms are
 * process-local: `server.to('bot:x').emit()` reaches only the clients connected
 * to the instance that happens to run the emit. Behind more than one replica the
 * majority of agents would silently receive nothing — the exact class of bug
 * this service exists to fix.
 *
 * This project already solved cross-instance delivery: publish on Redis
 * (`SEND_TO_OTHER`), and every instance checks its own per-userId socket
 * registry. That is the transport the widget and the agent console already use,
 * so the inbox uses it too. Fan-out is therefore addressed to agent USER IDS
 * rather than to a room name.
 *
 * WHY NO `platform` FIELD IS PASSED
 * ---------------------------------
 * `RedisPropagatorService.consumeSendEvent` switches on `platform` to decide
 * whether an event means "deliver over WhatsApp/Telegram" or "emit on this
 * user's socket". These events are dashboard notifications — they must take the
 * socket branch — so `platform` is deliberately omitted, which is what makes it
 * fall through to the socket emit. Passing the thread's channel here would try
 * to send the notification back out over WhatsApp.
 */
@Injectable()
export class InboxEventsService {
  private readonly logger = new Logger(InboxEventsService.name);

  constructor(
    private readonly redisPropagatorService: RedisPropagatorService,
    private readonly agentService: AgentService,
  ) {}

  /**
   * Emit to every dashboard user watching `botId`.
   *
   * Best-effort and never throws: this is called from the inbound message
   * pipeline AFTER the message has been persisted, so a fan-out failure must
   * degrade to "the agent has to refresh", never to "the message was lost".
   */
  private async broadcast(
    botId: string | undefined,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (!botId) {
      // Without a bot there is no audience to resolve. The message is already
      // stored, so this is a warning rather than an error.
      this.logger.warn(`Inbox ${event} has no botId; not broadcast`);
      return;
    }

    try {
      const recipientIds = await this.agentService.findInboxRecipientIds(botId);
      for (const userId of recipientIds) {
        this.redisPropagatorService.propagateEvent({
          userId,
          event,
          data,
          // platform intentionally omitted — see the class docblock.
        });
      }
    } catch (error) {
      this.logger.error(
        `Inbox fan-out failed for ${event} on bot ${botId}: ${error?.message}`,
      );
    }
  }

  /**
   * A message landed on a channel thread (either direction).
   *
   * `thread` travels with the message so the client can create a sidebar row for
   * a thread it has never seen without a follow-up fetch — the first message
   * from a new contact is the common case, and a round trip there would show an
   * empty inbox for a beat.
   */
  async publishMessage(params: {
    botId?: string;
    channel: string;
    threadId: string;
    message: InboxMessageView;
    thread: InboxThreadView;
  }): Promise<void> {
    await this.broadcast(params.botId, INBOX_SOCKET_MESSAGE, {
      channel: params.channel,
      threadId: params.threadId,
      message: params.message,
      thread: params.thread,
    });
  }

  /**
   * A thread's inbox-list state changed (preview, unread count, bot/agent
   * ownership) without a new message — e.g. after a read or a takeover.
   */
  async publishThreadUpdated(params: {
    botId?: string;
    channel: string;
    thread: InboxThreadView;
  }): Promise<void> {
    await this.broadcast(params.botId, INBOX_SOCKET_THREAD_UPDATED, {
      channel: params.channel,
      threadId: params.thread.id,
      thread: params.thread,
    });
  }

  /**
   * A delivery receipt advanced an outbound message's tick.
   *
   * Sent as its own small event rather than re-sending the whole message: acks
   * are by far the highest-frequency event on a busy channel, and the client
   * merges them with a forward-only rule so a replayed lower status cannot
   * downgrade a tick already on screen.
   */
  async publishMessageStatus(params: {
    botId?: string;
    channel: string;
    threadId: string;
    externalMessageId: string;
    status: string;
  }): Promise<void> {
    await this.broadcast(params.botId, INBOX_SOCKET_MESSAGE_STATUS, {
      channel: params.channel,
      threadId: params.threadId,
      externalMessageId: params.externalMessageId,
      status: params.status,
    });
  }

  /**
   * The set of channels or their thread counts changed — refetch the tab list.
   *
   * Carries no payload beyond the channel that triggered it: the counts are an
   * aggregate the client must read back anyway, and sending a snapshot here would
   * race with the client's own scoped view of it. Emitted only when a thread was
   * actually created, so a reconnect that merely refreshed names does not make
   * every dashboard refetch.
   */
  async publishChannelsChanged(params: {
    botId?: string;
    channel: string;
  }): Promise<void> {
    await this.broadcast(params.botId, INBOX_SOCKET_CHANNELS_CHANGED, {
      channel: params.channel,
    });
  }
}
