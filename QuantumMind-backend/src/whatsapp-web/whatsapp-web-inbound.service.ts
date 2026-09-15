import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { InboxEventsService } from 'src/inbox/inbox-events.service';
import {
  INBOX_MARK_READ_EVENT,
  INBOX_REQUEST_HISTORY_EVENT,
  INBOX_SEND_MESSAGE_EVENT,
  InboxMarkReadEvent,
  InboxRequestHistoryEvent,
  InboxSendMessageEvent,
  InboxSendResult,
} from 'src/inbox/inbox.constants';
import { toMessageView, toThreadView } from 'src/inbox/inbox.mapper';
import { WhatsappWebSessionStatus } from './enums/session-status.enum';
import {
  WA_WEB_ACK_EVENT,
  WA_WEB_CHANNEL,
  WA_WEB_CHATS_EVENT,
  WA_WEB_HISTORY_EVENT,
  WA_WEB_INBOUND_EVENT,
  WA_WEB_SEND_EVENT,
  WA_WEB_STATUS_EVENT,
} from './constants';
import {
  BaileysEngineService,
  WaWebChatSummary,
  WaWebInboundMessage,
} from './engine/baileys-engine.service';
import { WhatsappWebRateLimiter } from './whatsapp-web-rate-limiter';
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
    private readonly inboxEventsService: InboxEventsService,
    private readonly rateLimiter: WhatsappWebRateLimiter,
    private readonly configService: ConfigService,
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

      // 2b. A message WE just sent echoes back through `messages.upsert` with
      //     `fromMe: true`. We already hold that row — the agent/bot path wrote it
      //     and stamped the channel's id onto it — so inserting again would render
      //     a second bubble for one message. Adopt the echo onto the existing row
      //     instead of creating a new one.
      //
      //     Matched on the channel's own message id, which
      //     `linkOutboundChannelMessage` has already written, so this only ever
      //     matches a row that is genuinely the same message.
      if (msg.fromMe) {
        const known = await this.conversationService.findChannelMessage(
          threadId,
          msg.messageId,
        );
        if (known) {
          this.logger.debug(
            `Echo of our own message ${msg.messageId} already stored; not duplicating`,
          );
          // Still refresh the preview/cursor, then stop: re-announcing would push
          // a second copy to every dashboard.
          await this.updateThreadBookkeeping(threadId, msg, known);
          return;
        }
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

      // 5. Announce it to the dashboard. Deliberately AFTER persistence and
      //    after the dedup gate, so an agent's screen shows exactly what the
      //    database holds and a re-fired message cannot paint a duplicate
      //    bubble. Historical rows are skipped: a backfill is not new activity
      //    and would otherwise flood the inbox with months-old messages.
      if (!msg.historical) {
        await this.announceToInbox(threadId, chat, botId);
      }

      // 6. A backfilled message must never reach the bot: replaying history
      //    would make the bot answer months-old messages in bulk.
      if (msg.historical) return;

      // 7. Nor must our own outgoing message — it is already delivered, and
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

  /**
   * Push a freshly-stored message to the dashboard inbox.
   *
   * Re-reads the thread rather than reusing the copy from step 1: the preview and
   * unread count were just rewritten by `updateThreadBookkeeping`, and sending
   * the pre-update copy would show a sidebar row one message behind.
   *
   * Never throws. The message is already persisted at this point, so the worst
   * outcome of a failure here is that the agent has to refresh — it must not
   * unwind the pipeline or stop the bot from replying.
   */
  private async announceToInbox(
    threadId: string,
    chat: any,
    botId: string,
  ): Promise<void> {
    if (!chat) return;
    try {
      const fresh = await this.channelThreadService.findByIdPopulated(threadId);
      if (!fresh) return;
      await this.inboxEventsService.publishMessage({
        botId,
        channel: WA_WEB_CHANNEL,
        threadId,
        message: toMessageView(chat),
        thread: toThreadView(fresh),
      });
    } catch (error) {
      this.logger.warn(
        `Inbox announce failed for thread ${threadId}: ${error?.message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Agent reply (request/response, unlike the fire-and-forget bot path)
  // ---------------------------------------------------------------------------

  /**
   * Deliver an agent reply and report the outcome.
   *
   * WHY THIS RETURNS A VALUE while `onSend` does not
   * ------------------------------------------------
   * `onSend` serves the bot, which has no caller waiting and nothing useful to do
   * with a failure. An agent reply has a human watching an HTTP request: telling
   * them "sent" when the socket was closed is the one outcome this whole phase
   * exists to prevent. `emitAsync` collects listener return values, so the inbox
   * can await this without importing the engine.
   *
   * Returns `null` — not a failure — for another channel's intent, so the inbox
   * can tell "no hub owns this channel" apart from "the send failed".
   */
  // NOTE: deliberately registered WITHOUT `{ async: true }`, unlike every other
  // handler in this file.
  //
  // eventemitter2 wraps an `async: true` listener in a `setImmediate` shim whose
  // return value is the Timeout object, not the handler's result — and it only
  // promisifies when `listener.constructor.name === 'AsyncFunction'`, which is
  // false here because Nest registers an arrow wrapper around the method. The
  // result: `emitAsync` resolved to `[Timeout]`, the inbox found no object with
  // `accepted`, and every reply failed with `channel_send_failed: no handler`
  // even though WhatsApp had already delivered it.
  //
  // Omitting the option keeps the returned promise intact, which is what makes
  // this a request/response intent rather than fire-and-forget.
  @OnEvent(INBOX_SEND_MESSAGE_EVENT)
  async onInboxSendMessage(
    event: InboxSendMessageEvent,
  ): Promise<InboxSendResult | null> {
    if (event?.channel !== WA_WEB_CHANNEL) return null;

    // Pre-flight so the common failure is a clean 409 rather than an exception
    // string. Advisory only: the session can drop between here and the send, which
    // the catch below turns into the same outcome.
    const liveStatus = this.engine.getStatus(event.sessionName);
    if (liveStatus !== WhatsappWebSessionStatus.READY) {
      return {
        accepted: false,
        reason: 'session_not_connected',
        detail: `session "${event.sessionName}" is ${liveStatus}`,
      };
    }

    const recipient = event.chatId;
    if (!recipient) {
      return { accepted: false, reason: 'no_reply_target' };
    }

    try {
      // Reuses the bot path's `deliver`, so both paths map our types onto WhatsApp
      // content identically and a new content kind only has to be handled once.
      const result = await this.deliver(
        { sessionName: event.sessionName, recipient },
        {
          id: event.correlationId,
          type: event.type,
          // `deliver` reads the payload from `value` for both text and media —
          // for media that value is the URL baileys fetches server-side.
          value: event.mediaUrl || event.message,
          mimetype: event.mimetype,
          fileName: event.fileName,
        },
      );

      if (!result?.messageId) {
        // The engine returned without an id: nothing downstream could ever bind a
        // receipt to this message, so it must not be reported as sent.
        return {
          accepted: false,
          reason: 'channel_send_failed',
          detail: 'channel returned no message id',
        };
      }

      return {
        accepted: true,
        externalMessageId: result.messageId,
        timestamp: result.timestamp,
      };
    } catch (error) {
      const message = error?.message || 'unknown error';
      // The rate limiter is a deliberate refusal, not a fault — classify it
      // first, before the heuristics below mistake it for something else.
      if (message === 'RATE_LIMITED') {
        return {
          accepted: false,
          reason: 'rate_limited',
          detail: `send rate limit for session "${event.sessionName}"`,
        };
      }
      // A closed socket is the session's problem; anything else at this point is
      // the request's. The distinction is what lets the API answer 5xx vs 422.
      const isSessionProblem = /not connected|closed|Connection/i.test(message);
      return {
        accepted: false,
        reason: isSessionProblem
          ? 'session_not_connected'
          : 'invalid_send_request',
        detail: message,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Chat list sync
  // ---------------------------------------------------------------------------

  /**
   * Materialise the chat list WhatsApp pushed as inbox threads.
   *
   * WHY THIS IS SEPARATE FROM THE MESSAGE PATH
   * ------------------------------------------
   * `processInbound` creates a thread as a side effect of a message arriving, so
   * without this handler the inbox could only ever show conversations that wrote
   * to us while the process was running — everything older was invisible even
   * though WhatsApp had already told us it exists. This is what makes the inbox
   * look like WhatsApp on first connect.
   *
   * Deliberately does NOT create a Visitor or a Conversation. Those are the bot
   * runtime's records and cost a multi-document write each; a chat we have never
   * exchanged a message with does not need them, and creating hundreds of empty
   * conversations on every connect would be both slow and misleading in the
   * reports. `resolveConversation` still creates them lazily on the first real
   * message, exactly as before.
   *
   * Also does NOT set `lastMessage`. The preview belongs to a message we have
   * actually stored; claiming one here would render a thread whose bubble list is
   * empty. `lastMessageAt` IS set, because it is what the inbox sorts on.
   */
  @OnEvent(WA_WEB_CHATS_EVENT, { async: true })
  async onChatsSync(event: {
    name: string;
    chats: WaWebChatSummary[];
  }): Promise<void> {
    if (!event?.chats?.length) return;

    try {
      const routing = await this.whatsappWebService.getRoutingInfo(event.name);
      if (!routing?.jarcubeBotId) {
        this.logger.warn(
          `No bot linked to WhatsApp Web session "${event.name}" — chat list ignored`,
        );
        return;
      }

      // Bound the work. A freshly paired account can push thousands of chats;
      // hydrating all of them stalls the event loop and floods the inbox with
      // long-dead conversations. Keep the most recently active ones — those are
      // what an agent opens first — and let the rest materialise lazily when a
      // message actually arrives on them (processInbound creates the thread).
      const max =
        this.configService.get<number>('whatsappWeb.chatSyncMaxChats') ?? 500;
      const chats = [...event.chats]
        .sort(
          (a, b) =>
            (b.lastActivityAt?.getTime() ?? 0) -
            (a.lastActivityAt?.getTime() ?? 0),
        )
        .slice(0, max);

      if (event.chats.length > max) {
        this.logger.log(
          `Chat sync for "${event.name}": capping ${event.chats.length} chats to the ${max} most recent`,
        );
      }

      // Sequential, not Promise.all: the connect-time sync can carry hundreds of
      // chats and each one is an upsert. Firing them together produced a
      // thundering herd against Mongo for what is background hydration with no
      // deadline — the same reasoning as the history batch in the engine.
      let created = 0;
      for (const chat of chats) {
        try {
          const outcome = await this.channelThreadService.upsertForChatSync({
            channel: WA_WEB_CHANNEL,
            sessionName: event.name,
            chatId: chat.jid,
            phone: chat.phone,
            pushName: chat.name,
            bot: routing.jarcubeBotId,
            lastMessageAt: chat.lastActivityAt,
            meta: chat.jid.endsWith('@lid') ? { lid: chat.jid } : undefined,
          });
          if (outcome.created) created++;
        } catch (error) {
          // One malformed chat must not abort the rest of the sync.
          this.logger.warn(
            `Chat sync failed for ${chat.jid}: ${error?.message}`,
          );
        }
      }

      if (created > 0) {
        this.logger.log(
          `Chat sync for "${event.name}": ${created} new thread(s) from ${chats.length} chat(s)`,
        );
        // Only announce when the tab list could have changed. A sync that only
        // refreshed names would otherwise make every dashboard refetch on every
        // reconnect.
        await this.inboxEventsService
          .publishChannelsChanged({
            botId: routing.jarcubeBotId,
            channel: WA_WEB_CHANNEL,
          })
          .catch(() => undefined);
      }
    } catch (error) {
      this.logger.error(
        `Chat sync failed for ${event?.name}: ${error?.message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Inbox requests (read receipts, on-demand history)
  //
  // The inbox module is channel-agnostic and must not import this engine, so it
  // publishes intent on EventEmitter2 and each channel hub picks up the events
  // addressed to its own channel. Same decoupling the outbound send path uses.
  // ---------------------------------------------------------------------------

  /**
   * Send the customer's blue ticks for messages the agent has now seen.
   *
   * Best-effort by design: the local unread badge is already cleared by the
   * caller, and a failed receipt has no consequence the agent can act on. A
   * session that is not connected simply cannot acknowledge, which is a warning
   * rather than an error.
   */
  @OnEvent(INBOX_MARK_READ_EVENT, { async: true })
  async onInboxMarkRead(event: InboxMarkReadEvent): Promise<void> {
    if (event?.channel !== WA_WEB_CHANNEL) return;
    if (!event.sessionName || !event.externalMessageIds?.length) return;

    try {
      await this.engine.markMessagesRead(
        event.sessionName,
        event.chatId,
        // WhatsApp acknowledges individual messages rather than a read-up-to
        // watermark, so every id has to be named. These are all inbound, hence
        // fromMe: false.
        event.externalMessageIds.map((id) => ({ id, fromMe: false })),
      );
    } catch (error) {
      this.logger.warn(
        `Read receipt failed for ${event.sessionName}/${event.chatId}: ${error?.message}`,
      );
    }
  }

  /**
   * Ask WhatsApp for an older page of one chat's history.
   *
   * The response does not come back here — WhatsApp answers asynchronously on
   * `messaging-history.set`, which the engine republishes as ordinary inbound
   * messages flagged `historical: true`. They therefore flow through the exact
   * same persist-and-dedup path as live messages, which is why paging needs no
   * separate storage route and cannot double-insert.
   */
  @OnEvent(INBOX_REQUEST_HISTORY_EVENT, { async: true })
  async onInboxRequestHistory(event: InboxRequestHistoryEvent): Promise<void> {
    if (event?.channel !== WA_WEB_CHANNEL) return;
    if (!event.sessionName || !event.oldest?.externalMessageId) return;

    try {
      const ok = await this.engine.requestOlderHistory(
        event.sessionName,
        {
          id: event.oldest.externalMessageId,
          fromMe: event.oldest.fromMe,
          jid: event.chatId,
          timestamp: new Date(event.oldest.time),
        },
        event.count,
      );
      if (!ok) {
        // The engine could not ask at all (unsupported build, or the call was
        // rejected). Marking the thread exhausted stops the UI from offering a
        // "load older" action that can never succeed.
        this.logger.warn(
          `History unavailable for ${event.sessionName}/${event.chatId}; marking thread exhausted`,
        );
        await this.channelThreadService.markHistoryExhausted(event.threadId);
      }
    } catch (error) {
      this.logger.warn(
        `History request failed for ${event.sessionName}: ${error?.message}`,
      );
    }
  }

  /**
   * Record when a channel says there is nothing older left.
   *
   * `isLatest` on an on-demand batch is WhatsApp telling us we have reached the
   * start of the chat. Persisting it is a permanent cost saving: the thread can
   * never be re-requested, so an agent repeatedly opening an old conversation
   * costs zero further round trips.
   *
   * Only on-demand batches are considered — the small sync WhatsApp pushes at
   * connect time also carries `isLatest` and does NOT mean the chat is fully
   * backfilled.
   */
  @OnEvent(WA_WEB_HISTORY_EVENT, { async: true })
  async onHistoryBatch(event: {
    name: string;
    count: number;
    onDemand: boolean;
    isLatest: boolean;
  }): Promise<void> {
    if (!event?.onDemand || !event.isLatest) return;
    this.logger.debug(
      `On-demand history for "${event.name}" reported the start of the chat`,
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
   * The bot a session routes to — the fan-out audience for its events.
   *
   * Receipts arrive in bursts (one per message per status step), so the lookup is
   * memoised per session name. Session→bot linkage only changes when an operator
   * edits the messenger, which is rare enough that a process-lifetime cache is
   * the right trade; a stale entry would at worst notify the previous bot's
   * agents until the next restart.
   */
  private readonly botIdBySession = new Map<string, string>();

  private async resolveBotId(sessionName: string): Promise<string | undefined> {
    if (!sessionName) return undefined;
    const cached = this.botIdBySession.get(sessionName);
    if (cached) return cached;
    const routing = await this.whatsappWebService
      .getRoutingInfo(sessionName)
      .catch(() => null);
    if (routing?.jarcubeBotId) {
      this.botIdBySession.set(sessionName, routing.jarcubeBotId);
      return routing.jarcubeBotId;
    }
    return undefined;
  }

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
        return;
      }

      // Only broadcast when the row actually MOVED. `advanceChannelMessageStatus`
      // returns null for a refused downgrade, so gating on it here means a
      // replayed lower receipt never reaches the client at all — the forward-only
      // rule is enforced once, at the source, instead of again in every consumer.
      if (updated.channelThread) {
        await this.inboxEventsService.publishMessageStatus({
          botId: await this.resolveBotId(event.name),
          channel: WA_WEB_CHANNEL,
          threadId: updated.channelThread.toString(),
          externalMessageId: event.messageId,
          status: updated.status,
        });
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

    // Resolved once, outside the try, so the catch can fail the row without a
    // second DB lookup — and so a resolve failure is not conflated with a send
    // failure.
    const target = await this.resolveSendTarget(data).catch(() => null);
    if (!target) {
      // No address means the message cannot go out at all. The bot path never
      // wrote a thread-scoped row for it (it has no thread here), so there is
      // nothing to mark failed — this is a genuine dead end, logged and dropped.
      this.logger.warn(
        `No WhatsApp Web reply address for user ${data?.userId}; message dropped`,
      );
      return;
    }

    try {
      const result = await this.deliver(target, message);

      if (!result?.messageId) {
        // The engine returned without an id: the message did not go out. Converge
        // with the agent path — mark the row failed and tell the dashboard —
        // rather than leaving it silently stuck (the old behaviour, where a
        // rejected bot reply sat `pending`/status-less forever).
        await this.failOutboundReply(target, message, 'channel returned no id');
        return;
      }

      // Stamp the WhatsApp identity onto the row the bot/agent path already
      // wrote, so the message belongs to the thread and a later receipt can find
      // it. Without this the row has no external id and could never leave `sent`.
      const linked = await this.conversationService
        .linkOutboundChannelMessage({
          correlationId: message.id,
          threadId: target.threadId,
          externalMessageId: result.messageId,
        })
        .catch((e) => {
          this.logger.warn(`Failed to link outbound message: ${e?.message}`);
          return null;
        });

      if (target.threadId) {
        await this.channelThreadService.touchLastMessage(target.threadId, {
          message: message.value || this.mediaPlaceholder(message.type),
          type: message.type || ChatTypeEnum.TEXT,
          time: result?.timestamp || new Date(),
          direction: ChatDirectionEnum.OUTBOUND,
          sender: message.senderId || message.sender,
        });

        // Show the bot's / agent's own reply in the inbox.
        //
        // Announced from the LINKED row rather than from `message`, so the
        // bubble carries the real message id, direction and `sent` status that
        // were just persisted — the same identity a later delivery receipt will
        // reference. Broadcasting the raw outbound payload instead would give the
        // client a row that no ack could ever match.
        if (linked) {
          await this.announceToInbox(
            target.threadId,
            linked,
            await this.resolveBotId(target.sessionName),
          );
        }
      }
    } catch (error) {
      this.logger.error(`WhatsApp Web send failed: ${error?.message}`);
      // A throw from the engine (closed socket, encode error, rate-limit refusal)
      // is the same failure class as a missing id — fail the row so it does not
      // sit pending forever. `target` is already resolved above.
      await this.failOutboundReply(target, message, error?.message).catch(
        () => undefined,
      );
    }
  }

  /**
   * Mark a bot/agent outbound reply failed and surface it to the dashboard.
   *
   * Convergence point for the two outbound paths: `InboxService.sendMessage`
   * (agent) already does this inline, and `onSend` (bot) used to only log. Both
   * now end a failed delivery the same way — the row goes to `failed` and an
   * `inbox:message-status` event lets every watching dashboard render the error
   * rather than a reply stuck `pending`.
   *
   * Best-effort by construction: it runs on the failure path, so a secondary
   * error here must not mask the original.
   */
  private async failOutboundReply(
    target: { sessionName: string; threadId?: string },
    message: any,
    reason?: string,
  ): Promise<void> {
    this.logger.warn(
      `WhatsApp Web reply ${message?.id} failed: ${reason ?? 'unknown'}`,
    );
    if (!message?.id) return;

    const failed = await this.conversationService
      .failOutboundByCorrelationId(message.id)
      .catch(() => null);
    if (!failed || !target.threadId) return;

    await this.inboxEventsService
      .publishMessageStatus({
        botId: await this.resolveBotId(target.sessionName),
        channel: WA_WEB_CHANNEL,
        threadId: target.threadId,
        // The correlation id is the only handle the client has before an external
        // id exists; publishMessageStatus carries it as the message key.
        externalMessageId: message.id,
        status: ChatStatusEnum.FAILED,
      })
      .catch(() => undefined);
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

    // The single wire choke point for every outbound path — bot and agent both
    // funnel through here, so the ban-risk cap belongs here rather than in one
    // caller. A refused send throws `RATE_LIMITED`, which onInboxSendMessage maps
    // to a `rate_limited` result and onSend turns into a failed row.
    if (!this.rateLimiter.tryConsume(sessionName)) {
      throw new Error('RATE_LIMITED');
    }

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

      case ChatTypeEnum.TEMPLATE: {
        // A native cta_url button opens the template inside WhatsApp's in-app
        // WebView, but it is a Business-account feature: from a personal linked
        // number WhatsApp ACCEPTS the relay (relayMessage resolves with an id)
        // and then silently DROPS it on the recipient side. Because the relay
        // does not throw, we cannot detect that drop — the customer would just
        // receive nothing while the dashboard shows "sent". So the button is
        // opt-in and only used for a genuinely public https URL; the default,
        // and every localhost / private-URL case, is a plain text link that
        // reliably arrives.
        const tpl = message.template;
        const url = tpl?.url;
        if (url && this.interactiveButtonsEnabled() && this.isPublicHttpsUrl(url)) {
          try {
            return await this.engine.sendCtaUrl(sessionName, recipient, {
              text: tpl.bodyText || message.value,
              buttonText: tpl.buttonText || 'Open',
              url,
            });
          } catch (error) {
            this.logger.warn(
              `cta_url button failed, falling back to a text link: ${error?.message}`,
            );
          }
        }
        // `value` already carries "<body>\n<button>: <url>" for text channels.
        const text =
          message.value ||
          (url ? `${tpl?.bodyText || ''}\n${tpl?.buttonText || 'Open'}: ${url}`.trim() : '');
        if (!text) return null;
        return this.engine.sendText(sessionName, recipient, text);
      }

      case ChatTypeEnum.TEXT:
      default:
        if (!message.value) return null;
        return this.engine.sendText(sessionName, recipient, message.value);
    }
  }

  /**
   * Interactive (cta_url) buttons are OFF unless `WHATSAPP_WEB_INTERACTIVE` /
   * `whatsappWeb.interactiveButtons` is explicitly truthy. They are unreliable
   * from a personal linked number and raise ban risk, so a deployment must opt
   * in deliberately.
   */
  private interactiveButtonsEnabled(): boolean {
    const raw =
      this.configService.get<string | boolean>(
        'whatsappWeb.interactiveButtons',
      ) ?? process.env.WHATSAPP_WEB_INTERACTIVE;
    return raw === true || raw === 'true' || raw === '1';
  }

  /**
   * A cta_url button is only valid for a publicly reachable https URL. WhatsApp
   * rejects http, localhost and private/loopback hosts (the message is dropped
   * without an error), so those must never take the button path.
   */
  private isPublicHttpsUrl(value: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  }
}
