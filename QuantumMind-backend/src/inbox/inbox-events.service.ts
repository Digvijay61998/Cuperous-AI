import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mongoose from 'mongoose';
import { AgentService } from 'src/agent/agent.service';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';
import { InboxMessageView, InboxThreadView } from './inbox.mapper';

/** Socket events the dashboard inbox subscribes to. */
export const INBOX_SOCKET_MESSAGE = 'inbox:message';
export const INBOX_SOCKET_THREAD_UPDATED = 'inbox:thread-updated';
export const INBOX_SOCKET_MESSAGE_STATUS = 'inbox:message-status';
export const INBOX_SOCKET_CHANNELS_CHANGED = 'inbox:channels-changed';
export const INBOX_SOCKET_AGENT_TYPING = 'inbox:agent-typing';

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
   * Emit to an explicit set of dashboard users (e.g. a Handover_Alert's stored
   * recipients). Same transport and failure semantics as `broadcast`.
   */
  emitToUsers(
    userIds: string[],
    event: string,
    data: Record<string, any>,
  ): void {
    for (const userId of new Set(userIds.filter(Boolean))) {
      try {
        this.redisPropagatorService.propagateEvent({ userId, event, data });
      } catch (error) {
        this.logger.error(
          `Inbox emit ${event} to ${userId} failed: ${error?.message}`,
        );
      }
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
   * The owner of a widget conversation is typing (R8.6). Sent to the bot's
   * inbox recipients except the typist; clients show "<name> is replying…"
   * and clear it after 5 s without a new signal.
   */
  @OnEvent('inbox.agent.typing', { async: true })
  async onAgentTyping(p: {
    visitorId: string;
    conversationId?: string;
    threadId?: string;
    agentId: string;
    name: string;
  }): Promise<void> {
    try {
      const botId = p.conversationId
        ? await this.botIdForConversation(p.conversationId)
        : undefined;
      if (!botId) return;
      const ids = (await this.agentService.findInboxRecipientIds(botId)).filter(
        (id) => String(id) !== String(p.agentId),
      );
      this.emitToUsers(ids, INBOX_SOCKET_AGENT_TYPING, {
        threadId: p.threadId,
        conversationId: p.conversationId,
        visitorId: p.visitorId,
        agentId: p.agentId,
        name: p.name,
      });
    } catch (error) {
      this.logger.warn(`Typing fan-out failed: ${error?.message}`);
    }
  }

  private async botIdForConversation(conversationId: string): Promise<string | undefined> {
    const Conversation: any = mongoose.models['Conversation'];
    if (!Conversation || !mongoose.isValidObjectId(conversationId)) return undefined;
    const c: any = await Conversation.findById(conversationId).select('bot').lean();
    return c?.bot ? String(c.bot) : undefined;
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
