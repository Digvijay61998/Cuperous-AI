import { Injectable, Logger, Optional } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ChannelThreadService } from 'src/channel-thread/channel-thread.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { PlatformEnum } from 'src/conversation/enums/platform.enum';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';
import { generateId } from 'src/util';
import {
  INBOX_SEND_MESSAGE_EVENT,
  InboxSendMessageEvent,
  InboxSendResult,
} from './inbox.constants';
import { toMessageView, toThreadView } from './inbox.mapper';
import { InboxEventsService } from './inbox-events.service';
import {
  VISITOR_DETAILS_UPDATED,
  VisitorDetailsUpdated,
} from 'src/crm-bridge/contact-capture.service';

/** The inbox channel string for the website chat widget. */
export const WIDGET_CHANNEL = PlatformEnum.WIDGET;

/**
 * Mirrors website-widget chats into the omnichannel inbox.
 *
 * WHY THIS EXISTS
 * ---------------
 * WhatsApp Web shows up on the dashboard because its inbound pipeline creates a
 * ChannelThread and calls `announceToInbox`. The widget pipeline only ever
 * persisted a Chat row (via the `create.new.chat` event) — it never built a
 * thread and never announced — so widget conversations were invisible in the
 * inbox even though every message was in the database.
 *
 * This service closes that gap WITHOUT touching the widget message flow. It
 * listens for the single `chat.persisted` event that `ConversationService`
 * now emits after every stored chat, filters to the widget platform, lazily
 * creates one ChannelThread per widget conversation, binds it, and announces
 * the message on the same realtime path WhatsApp uses.
 *
 * Keyed by conversation id, not visitor id: a widget visitor's Conversation is
 * the durable unit here (unlike WhatsApp, where one permanent thread spans many
 * conversations). Using the conversation id as the thread's `chatId` gives a
 * stable 1:1 mapping and a unique key for the (channel, sessionName, chatId)
 * index.
 *
 * Event-driven on purpose: a direct call from ConversationService into
 * InboxEventsService (which injects AgentService, which injects
 * ConversationService) would close a DI cycle. The emitter breaks it.
 */
@Injectable()
export class WidgetInboxBridgeService {
  private readonly logger = new Logger(WidgetInboxBridgeService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly channelThreadService: ChannelThreadService,
    private readonly inboxEventsService: InboxEventsService,
    private readonly redisPropagatorService: RedisPropagatorService,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  @OnEvent('chat.persisted', { async: true })
  async onChatPersisted(payload: {
    chatId: string;
    conversationId: string;
  }): Promise<void> {
    try {
      if (!payload?.conversationId || !payload?.chatId) return;

      const conv = await this.conversationService.getConversationRouting(
        payload.conversationId,
      );
      // Only the widget channel is handled here. Social channels (whatsapp_web,
      // telegram, ...) build their own threads in their own inbound pipelines;
      // double-handling them would create a second, duplicate thread.
      if (!conv || conv.platform !== WIDGET_CHANNEL) return;
      if (!conv.bot) {
        this.logger.warn(
          `Widget conversation ${conv._id} has no bot; not mirrored to inbox`,
        );
        return;
      }

      // One thread per widget conversation. `chatId` = conversationId gives the
      // stable, unique key the (channel, sessionName, chatId) index needs.
      const thread = await this.channelThreadService.upsertForInbound({
        channel: WIDGET_CHANNEL,
        chatId: conv._id,
        bot: conv.bot,
      });
      const threadId = (thread._id as any).toString();

      // Bind the visitor + conversation the first time we see this thread, so the
      // inbox can resolve a reply target and show the visitor's name.
      if (!thread.conversation || !thread.visitor) {
        await this.channelThreadService.attachConversation(threadId, {
          visitor: conv.visitor,
          conversation: conv._id,
          bot: conv.bot,
        });
      }
      if (conv.channelThread !== threadId) {
        await this.conversationService.bindChatToThread(
          conv._id,
          payload.chatId,
          threadId,
        );
      }

      const chat = await this.conversationService.getChatById(payload.chatId);
      if (!chat) return;

      // Keep the inbox preview + unread badge current. Our own bot/agent replies
      // (sender === bot) must not raise the visitor's unread count.
      const isInbound = String(chat.sender) !== String(conv.bot);
      await this.channelThreadService.touchLastMessage(
        threadId,
        {
          message: chat.message || `[${chat.type}]`,
          type: chat.type,
          time: chat.time || new Date(),
          sender: chat.sender,
        },
        isInbound,
      );

      // Announce on the same realtime path WhatsApp uses. Best-effort: a fan-out
      // failure must never unwind the persistence that already succeeded.
      const fresh =
        (await this.channelThreadService.findByIdPopulated(threadId)) ?? thread;
      await this.inboxEventsService.publishMessage({
        botId: conv.bot,
        channel: WIDGET_CHANNEL,
        threadId,
        message: toMessageView(chat, { botId: conv.bot, visitorId: conv.visitor }),
        thread: toThreadView(fresh),
      });

      // An alert raised before this thread existed carries no threadId yet.
      this.eventEmitter?.emit('handover.thread.bound', {
        conversationId: String(conv._id),
        threadId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to mirror widget chat ${payload?.chatId} to inbox: ${error?.message}`,
      );
    }
  }

  /**
   * The visitor told us their name (or email/phone): republish their inbox
   * threads so the list and the open thread header stop saying "Anonymous"
   * without a reload (crm-plugins-service-desk R4.4, R4.5). Best-effort.
   */
  @OnEvent(VISITOR_DETAILS_UPDATED, { async: true })
  async onVisitorDetailsUpdated(p: VisitorDetailsUpdated): Promise<void> {
    try {
      if (!p?.visitorId) return;
      const threads = await this.channelThreadService.findForVisitorOrConversation(
        p.visitorId,
        p.conversationId,
      );
      for (const thread of threads) {
        const botId = (thread.bot as any)?._id ?? thread.bot ?? p.botId;
        await this.inboxEventsService.publishThreadUpdated({
          botId: botId ? String(botId) : p.botId,
          channel: thread.channel,
          thread: toThreadView(thread),
        });
      }
    } catch (error) {
      this.logger.warn(`Thread refresh after visitor update failed: ${error?.message}`);
    }
  }

  /**
   * Deliver an agent reply to a widget visitor.
   *
   * The inbox send pipeline (InboxService.sendMessage) has already persisted the
   * reply row and will announce it to the dashboard; this handler's only job is
   * to push the message down the visitor's live socket and report the outcome,
   * mirroring WhatsappWebInboundService.onInboxSendMessage for the widget channel.
   *
   * Registered WITHOUT `{ async: true }` for the same reason the WhatsApp handler
   * is: eventemitter2 wraps an async-flagged listener in a setImmediate shim whose
   * return value is a Timeout, not the handler's result, so `emitAsync` in the
   * inbox would never see the `accepted` field. Returns `null` for any channel we
   * do not own so the inbox can tell "no handler" from "send failed".
   */
  @OnEvent(INBOX_SEND_MESSAGE_EVENT)
  async onInboxSendMessage(
    event: InboxSendMessageEvent,
  ): Promise<InboxSendResult | null> {
    if (event?.channel !== WIDGET_CHANNEL) return null;

    try {
      // The thread's chatId IS the widget conversation id (see onChatPersisted),
      // and the thread carries the visitor to deliver to.
      const thread = await this.channelThreadService.getReplyTargetByThread(
        event.threadId,
      );
      const full = await this.channelThreadService.findById(event.threadId);
      const visitorId = full?.visitor ? String(full.visitor) : undefined;
      if (!thread || !visitorId) {
        return { accepted: false, reason: 'no_reply_target' };
      }

      const messageId = event.correlationId || generateId('message', 10);

      // Deliver over the visitor's live socket. No `platform` field, so this
      // takes the socket-emit branch in consumeSendEvent, exactly like the
      // existing widget/dashboard delivery path. `propagateEvent` returns false
      // only when there is no userId; an evicted/closed socket is handled inside
      // consumeSendEvent (nothing to emit to), so this is best-effort delivery.
      const delivered = this.redisPropagatorService.propagateEvent({
        userId: visitorId,
        event: 'chat-message-bot',
        data: {
          message: {
            id: messageId,
            type: event.type || 'text',
            value: event.message,
            time: new Date().toISOString(),
            // Mark it as an agent (not bot) message so the widget notifies as
            // "Agent" and keeps the handoff framing.
            switchToAgent: true,
            // Explicit author so the widget draws it on the org side. With no
            // sender id it used to match the visitor's own undefined id.
            senderRole: 'agent',
          },
        },
      });

      if (!delivered) {
        return { accepted: false, reason: 'no_reply_target' };
      }

      return {
        accepted: true,
        externalMessageId: messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Widget reply on thread ${event?.threadId} failed: ${error?.message}`,
      );
      return {
        accepted: false,
        reason: 'channel_send_failed',
        detail: error?.message,
      };
    }
  }
}
