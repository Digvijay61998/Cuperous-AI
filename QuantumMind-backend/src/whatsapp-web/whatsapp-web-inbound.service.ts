import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelThreadService } from 'src/channel-thread/channel-thread.service';
import { ChatInitializerService } from 'src/chat-initializer/chat-initializer.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { ChatDirectionEnum } from 'src/conversation/enums/chat-direction.enum';
import { ChatStatusEnum } from 'src/conversation/enums/chat-status.enum';
import { ChatTypeEnum } from 'src/conversation/enums/chat-type.enum';
import { ConversationStatusEnum } from 'src/conversation/enums/conversation-status.enum';
import { PlatformEnum } from 'src/conversation/enums/platform.enum';
import { MessageHandlerService } from 'src/message-handler/message-handler.service';
import { SocketStateService } from 'src/socket/socket-state.service';
import {
  WA_WEB_ACK_EVENT,
  WA_WEB_CHANNEL,
  WA_WEB_INBOUND_EVENT,
  WA_WEB_SEND_EVENT,
  WA_WEB_STATUS_EVENT,
} from './constants';
import {
  BaileysEngineService,
  WaWebInboundMessage,
} from './engine/baileys-engine.service';
import { WhatsappWebService } from './whatsapp-web.service';

/**
 * Bridges the leaf baileys engine to the JarCube conversation + bot runtime.
 *
 * The ordering rule this service exists to enforce is **persist, then publish,
 * exactly once**:
 *
 *   1. upsert the durable ChannelThread (so a reply is always possible later),
 *   2. make sure a Visitor + Conversation exist,
 *   3. insert the message row — the unique (thread, externalMessageId) index is
 *      the dedup oracle, so a re-fired message stops here,
 *   4. only then route it onward to the bot or the assigned agent.
 *
 * Doing it in that order is what makes the pipeline idempotent under engine
 * replays: WhatsApp re-delivers messages after a reconnect, and history batches
 * overlap with live ones.
 *
 * Living in the feature module (rather than in message-handler) keeps the engine
 * dependency out of the message handler and avoids a circular module graph.
 */
@Injectable()
export class WhatsappWebInboundService {
  private readonly logger = new Logger(WhatsappWebInboundService.name);

  constructor(
    private readonly whatsappWebService: WhatsappWebService,
    private readonly chatInitializerService: ChatInitializerService,
    private readonly socketStateService: SocketStateService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly conversationService: ConversationService,
    private readonly channelThreadService: ChannelThreadService,
    private readonly engine: BaileysEngineService,
  ) {}

  @OnEvent(WA_WEB_STATUS_EVENT, { async: true })
  async onStatus(event: {
    name: string;
    status: string;
    phone?: string;
    pushName?: string;
    error?: string;
  }): Promise<void> {
    try {
      await this.whatsappWebService.applyStatusEvent(event);
    } catch (error) {
      this.logger.error(
        `Failed to persist status for ${event?.name}: ${error?.message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Inbound
  // ---------------------------------------------------------------------------

  /**
   * Serialises inbound processing per conversation partner.
   *
   * Two messages from the same contact can be in flight at once (a customer
   * sending twice quickly, or a live message overlapping a history batch). Both
   * would then reach `resolveConversation` before either had attached a
   * conversation to the thread, and each would ask the initializer for one —
   * producing two conversations for one thread and splitting the history.
   *
   * The chain is keyed per contact, so unrelated conversations still process in
   * parallel. Entries are deleted once their chain drains, so the map cannot
   * grow without bound.
   */
  private readonly inboundChains = new Map<string, Promise<void>>();

  private serializePerThread(key: string, work: () => Promise<void>): Promise<void> {
    const previous = this.inboundChains.get(key) ?? Promise.resolve();
    // `.catch` before chaining: one failed message must not poison the chain and
    // reject every later message for the same contact.
    const next = previous.catch(() => undefined).then(work);
    this.inboundChains.set(key, next);
    void next.finally(() => {
      // Only clear when no newer message has taken over the slot.
      if (this.inboundChains.get(key) === next) {
        this.inboundChains.delete(key);
      }
    });
    return next;
  }

  @OnEvent(WA_WEB_INBOUND_EVENT, { async: true })
  async onInbound(msg: WaWebInboundMessage): Promise<void> {
    return this.serializePerThread(
      `${WA_WEB_CHANNEL}:${msg?.name}:${msg?.jid}`,
      () => this.processInbound(msg),
    );
  }

  private async processInbound(msg: WaWebInboundMessage): Promise<void> {
    try {
      const routing = await this.whatsappWebService.getRoutingInfo(msg.name);
      if (!routing?.jarcubeBotId) {
        this.logger.warn(
          `No bot linked to WhatsApp Web session "${msg.name}" — dropping message`,
        );
        return;
      }
      const botId = routing.jarcubeBotId;

      // 1. Durable thread. Created before anything else so that even if the
      //    steps below fail we still know how to reach this contact.
      const thread = await this.channelThreadService.upsertForInbound({
        channel: WA_WEB_CHANNEL,
        sessionName: msg.name,
        chatId: msg.jid,
        phone: msg.phone,
        // Our own outgoing messages carry OUR push name, not the contact's —
        // writing it would rename the customer to the business account.
        pushName: msg.fromMe ? undefined : msg.pushName,
        bot: botId,
        meta: msg.jid.endsWith('@lid') ? { lid: msg.jid } : undefined,
      });
      const threadId = (thread._id as any).toString();

      // 2. Visitor + conversation to attach the message to.
      const binding = await this.resolveConversation(thread, msg, botId);
      if (!binding) {
        this.logger.error(
          `Could not resolve a conversation for thread ${threadId}; message ${msg.messageId} not stored`,
        );
        return;
      }

      // 3. Persist. `created: false` means the engine re-fired a message we
      //    already hold — it must not be published or answered a second time.
      const { chat, created } = await this.conversationService.saveChannelMessage(
        {
          conversationId: binding.conversationId,
          message: msg.text,
          // Our side is attributed to the bot so the dashboard renders it on the
          // right; the contact's own messages are attributed to the visitor.
          sender: msg.fromMe ? botId : binding.visitorId,
          type: msg.type,
          time: msg.time,
          channelThread: threadId,
          externalMessageId: msg.messageId,
          direction: msg.fromMe
            ? ChatDirectionEnum.OUTBOUND
            : ChatDirectionEnum.INBOUND,
          // An inbound message has no delivery ladder of its own. An outbound one
          // observed here was already accepted by WhatsApp, so it is at least sent.
          status: msg.fromMe ? ChatStatusEnum.SENT : undefined,
          authorName: msg.fromMe ? undefined : msg.pushName,
          mimetype: msg.mimetype,
          fileName: msg.fileName,
          mediaOmitted: msg.mediaOmitted,
          quotedMessageId: msg.quotedMessageId,
          historical: msg.historical,
        },
      );

      if (!created) {
        this.logger.debug(
          `Duplicate WhatsApp message ${msg.messageId} ignored on thread ${threadId}`,
        );
        return;
      }

      // 4. Keep the inbox preview + history cursor current.
      await this.updateThreadBookkeeping(threadId, msg, chat);

      // 5. A backfilled message must never reach the bot: replaying history
      //    would make the bot answer months-old messages in bulk.
      if (msg.historical) return;

      // 6. Nor must our own outgoing message — it is already delivered, and
      //    feeding it back in would make the bot reply to itself.
      if (msg.fromMe) return;

      await this.routeToBotOrAgent(thread, threadId, msg, binding, botId);
    } catch (error) {
      this.logger.error(
        `Inbound routing failed for ${msg?.name}/${msg?.messageId}: ${error?.message}`,
        error?.stack,
      );
    }
  }

  /**
   * Ensure the thread has a live Visitor + Conversation, reusing the existing
   * pair when it is still open.
   *
   * A WhatsApp thread outlives any single Conversation (those are closed by the
   * user or expired by a 2-hourly cron), so this rotates onto a fresh
   * conversation when the old one is finished while keeping the same thread and
   * the same visitor.
   */
  private async resolveConversation(
    thread: any,
    msg: WaWebInboundMessage,
    botId: string,
  ): Promise<{ visitorId: string; conversationId: string } | null> {
    // Fast path: the thread already points at an open conversation AND the bot
    // runtime state for that visitor is still in memory.
    //
    // The socket-state check is essential, not belt-and-braces. After a restart
    // (or an idle eviction) the conversation row is still open but its bot state
    // — current node, bot settings, flow graph — is gone, and
    // MessageHandlerService.handleMessage returns immediately when it finds no
    // state. Taking the fast path in that situation stored the message and then
    // silently never answered it. Falling through to the initializer instead
    // rebuilds the state, which is the documented behaviour for an evicted
    // entry.
    if (thread.visitor && thread.conversation) {
      const visitorId = thread.visitor.toString();
      const hasLiveState = !!this.socketStateService.getUserData(visitorId)
        ?.currentNode;
      if (hasLiveState) {
        const status = await this.conversationService
          .getConversationStatus(thread.conversation.toString())
          .catch(() => null);
        if (status === ConversationStatusEnum.IN_PROGRESS) {
          return {
            visitorId,
            conversationId: thread.conversation.toString(),
          };
        }
      }
    }

    // Otherwise let the shared initializer create/refresh the visitor, the bot
    // state and a conversation, exactly as the other social channels do.
    const visitor = await this.chatInitializerService.initializeChat(
      {
        name: msg.pushName || msg.phone || msg.jid,
        username: msg.phone || msg.jid,
        phone: msg.phone,
        bot: botId,
        platform: PlatformEnum.WHATSAPP_WEB,
      },
      botId,
    );
    if (!visitor?.visitorId) return null;

    // The initializer puts the conversation id in socket state; that is the only
    // place it surfaces.
    const state = this.socketStateService.getUserData(visitor.visitorId);
    const conversationId = state?.conversationId;
    if (!conversationId) return null;

    await this.channelThreadService.attachConversation(
      (thread._id as any).toString(),
      {
        visitor: visitor.visitorId,
        conversation: conversationId,
        bot: botId,
      },
    );

    return { visitorId: visitor.visitorId, conversationId };
  }

  /** Refresh the inbox preview and the oldest-message cursor used by history paging. */
  private async updateThreadBookkeeping(
    threadId: string,
    msg: WaWebInboundMessage,
    chat: any,
  ): Promise<void> {
    // A historical row must not overwrite the "latest message" preview, and must
    // not raise the unread badge — it is old news by definition.
    if (!msg.historical) {
      await this.channelThreadService.touchLastMessage(
        threadId,
        {
          message: msg.text || this.mediaPlaceholder(msg.type),
          type: msg.type,
          time: msg.time,
          direction: msg.fromMe
            ? ChatDirectionEnum.OUTBOUND
            : ChatDirectionEnum.INBOUND,
          sender: chat?.sender,
        },
        // Only a message FROM the contact can be unread by us.
        !msg.fromMe,
      );
    }

    await this.channelThreadService.extendOldestBoundary(
      threadId,
      msg.time,
      msg.messageId,
    );
  }

  /** Human-readable stand-in for a media message with no caption. */
  private mediaPlaceholder(type: string): string {
    switch (type) {
      case ChatTypeEnum.IMAGE:
        return '📷 Photo';
      case ChatTypeEnum.VIDEO:
        return '🎥 Video';
      case ChatTypeEnum.AUDIO:
        return '🎤 Audio';
      case ChatTypeEnum.FILE:
        return '📄 Document';
      case ChatTypeEnum.MAPS:
        return '📍 Location';
      default:
        return '';
    }
  }

  /**
   * Hand the message to whoever owns the thread.
   *
   * The thread's own `botEnabled`/`handledByAgent` flags are the authority
   * rather than in-memory socket state, so a takeover survives a restart: after
   * one, socket state is empty and the bot would otherwise start answering a
   * conversation a human had already taken over.
   */
  private async routeToBotOrAgent(
    thread: any,
    threadId: string,
    msg: WaWebInboundMessage,
    binding: { visitorId: string; conversationId: string },
    botId: string,
  ): Promise<void> {
    // The reply context the outbound path uses. Still written to socket state
    // (that is what the existing bot/agent send path reads), but it is no longer
    // the only copy — the thread holds the durable one.
    const ctx = {
      whatsappWeb: {
        sessionName: msg.name,
        jid: msg.jid,
        recipient: msg.phone || msg.jid,
        threadId,
      },
    };
    this.socketStateService.updateUserData(binding.visitorId, { ctx });

    const state = this.socketStateService.getUserData(binding.visitorId);
    const agentId = thread.assignedAgent?.toString() || state?.assignedAgentId;
    const handledByAgent = thread.handledByAgent || state?.handledByAgent;

    if (handledByAgent && agentId) {
      // A human owns this thread — forward to them and keep the bot out of it.
      this.messageHandlerService.sendMessageToAgent(
        agentId,
        {
          type: msg.type,
          value: msg.text || this.mediaPlaceholder(msg.type),
          from: binding.visitorId,
        },
        state,
      );
      return;
    }

    if (thread.botEnabled === false) {
      // Bot explicitly paused with nobody assigned: store and stay silent
      // rather than answering against the operator's wishes.
      this.logger.debug(`Bot disabled on thread ${threadId}; message stored only`);
      return;
    }

    const user: any = {
      auth: {
        userId: binding.visitorId,
        email: '',
        name: msg.pushName || msg.phone || msg.jid,
        role: 'visitor',
      },
    };

    await this.messageHandlerService.handleMessage(
      msg.text || this.mediaPlaceholder(msg.type),
      user,
      msg.type,
      state?.language || 'en',
      ctx,
    );
  }

  // ---------------------------------------------------------------------------
  // Delivery receipts
  // ---------------------------------------------------------------------------

  /**
   * Apply a delivery/read receipt to the stored message.
   *
   * The forward-only guard lives inside `advanceChannelMessageStatus`, so a late
   * `delivered` arriving after `read` is refused rather than downgrading a tick
   * the agent already saw.
   */
  @OnEvent(WA_WEB_ACK_EVENT, { async: true })
  async onAck(event: {
    name: string;
    messageId: string;
    status: string;
    jid?: string;
  }): Promise<void> {
    try {
      const updated = await this.conversationService.advanceChannelMessageStatus(
        event.messageId,
        event.status,
      );
      if (!updated) {
        // Normal and expected: receipts also arrive for messages sent from the
        // operator's phone before we ever stored them, and for statuses that do
        // not advance the ladder.
        this.logger.debug(
          `Ack ${event.status} for ${event.messageId} advanced no row`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to apply ack for ${event?.messageId}: ${error?.message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Outbound
  // ---------------------------------------------------------------------------

  /**
   * Deliver a bot/agent reply out through the engine.
   *
   * The reply address is resolved from the durable thread whenever the in-memory
   * `ctx` is unavailable, which is what lets an agent answer after a restart or
   * after the conversation state has been evicted for idleness.
   */
  @OnEvent(WA_WEB_SEND_EVENT, { async: true })
  async onSend(data: {
    ctx?: any;
    message: any;
    userId?: string;
  }): Promise<void> {
    const message = data?.message;
    if (!message) return;

    try {
      const target = await this.resolveSendTarget(data);
      if (!target) {
        this.logger.warn(
          `No WhatsApp Web reply address for user ${data?.userId}; message dropped`,
        );
        return;
      }

      const result = await this.deliver(target, message);

      // Stamp the WhatsApp identity onto the row the bot/agent path already
      // wrote, so the message belongs to the thread and a later receipt can find
      // it. Without this the row has no external id and could never leave `sent`.
      if (result?.messageId) {
        await this.conversationService
          .linkOutboundChannelMessage({
            correlationId: message.id,
            threadId: target.threadId,
            externalMessageId: result.messageId,
          })
          .catch((e) =>
            this.logger.warn(`Failed to link outbound message: ${e?.message}`),
          );
      }

      if (target.threadId) {
        await this.channelThreadService.touchLastMessage(target.threadId, {
          message: message.value || this.mediaPlaceholder(message.type),
          type: message.type || ChatTypeEnum.TEXT,
          time: result?.timestamp || new Date(),
          direction: ChatDirectionEnum.OUTBOUND,
          sender: message.senderId || message.sender,
        });
      }
    } catch (error) {
      this.logger.error(`WhatsApp Web send failed: ${error?.message}`);
    }
  }

  /**
   * Work out where a reply should go, preferring the live context and falling
   * back to the durable thread.
   */
  private async resolveSendTarget(data: {
    ctx?: any;
    userId?: string;
  }): Promise<{
    sessionName: string;
    recipient: string;
    threadId?: string;
  } | null> {
    const ww = data?.ctx?.whatsappWeb;
    if (ww?.sessionName && (ww.recipient || ww.jid)) {
      return {
        sessionName: ww.sessionName,
        recipient: ww.recipient || ww.jid,
        threadId: ww.threadId,
      };
    }

    // Fallback: the in-memory context is gone (restart, idle eviction, LRU) but
    // the thread still knows how to reach this contact.
    if (!data?.userId) return null;
    const fromThread = await this.channelThreadService.getReplyTargetByVisitor(
      data.userId,
    );
    if (!fromThread || fromThread.channel !== WA_WEB_CHANNEL) return null;
    this.logger.debug(
      `Recovered WhatsApp reply address for ${data.userId} from thread ${fromThread.threadId}`,
    );
    return {
      sessionName: fromThread.sessionName,
      recipient: fromThread.phone || fromThread.chatId,
      threadId: fromThread.threadId,
    };
  }

  /** Push one message onto the wire, mapping our types to WhatsApp content. */
  private async deliver(
    target: { sessionName: string; recipient: string },
    message: any,
  ): Promise<{ messageId?: string; timestamp: Date } | null> {
    const { sessionName, recipient } = target;

    switch (message.type) {
      case ChatTypeEnum.IMAGE:
        return this.engine.sendImage(sessionName, recipient, message.value);

      case ChatTypeEnum.VIDEO:
      case ChatTypeEnum.AUDIO:
      case ChatTypeEnum.FILE:
        return this.engine.sendMedia(
          sessionName,
          recipient,
          message.value,
          message.type,
          { mimetype: message.mimetype, fileName: message.fileName },
        );

      case ChatTypeEnum.MAPS: {
        // No native location send wired yet — send a maps link so the
        // information still reaches the customer instead of vanishing.
        const loc = message.location;
        const text = loc
          ? `📍 https://maps.google.com/?q=${loc.latitude},${loc.longitude}`
          : message.value;
        return this.engine.sendText(sessionName, recipient, text);
      }

      case ChatTypeEnum.BUTTONS:
      case ChatTypeEnum.QUICK_REPLY: {
        // baileys has no dependable interactive-button support, so the options
        // are degraded to a numbered list appended to the prompt. The customer
        // replies with a number, which the bot's matching already understands.
        const lines = (message.buttons || [])
          .map((b: any, i: number) => `${i + 1}. ${b.title || b.value}`)
          .join('\n');
        const text = [message.value, lines].filter(Boolean).join('\n');
        return this.engine.sendText(sessionName, recipient, text);
      }

      case ChatTypeEnum.TEXT:
      default:
        if (!message.value) return null;
        return this.engine.sendText(sessionName, recipient, message.value);
    }
  }
}
