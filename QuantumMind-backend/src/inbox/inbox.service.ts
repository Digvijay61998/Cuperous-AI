import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AgentService } from 'src/agent/agent.service';
import { LIVE_CHAT_CONNECTED } from 'src/incident/constants';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { Role } from 'src/common/enums/role.enum';
import { ChannelThreadService } from 'src/channel-thread/channel-thread.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { ChatDirectionEnum } from 'src/conversation/enums/chat-direction.enum';
import { ChatStatusEnum } from 'src/conversation/enums/chat-status.enum';
import { ChatTypeEnum } from 'src/conversation/enums/chat-type.enum';
import { ConversationStatusEnum } from 'src/conversation/enums/conversation-status.enum';
import { ConversationTypeEnum } from 'src/conversation/enums/conversation-type.enum';
import { pendingExternalId } from 'src/conversation/entities/chat.entity';
import { SocketStateService } from 'src/socket/socket-state.service';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { generateId } from 'src/util';
import { BotControlDto } from './dto/bot-control.dto';
import { SendInboxMessageDto } from './dto/send-message.dto';
import { InboxEventsService } from './inbox-events.service';
import {
  INBOX_CHANNEL_STATUS_EVENT,
  INBOX_MARK_READ_EVENT,
  INBOX_REQUEST_HISTORY_EVENT,
  INBOX_SEND_MESSAGE_EVENT,
  InboxChannelStatusQuery,
  InboxChannelStatusResult,
  InboxMarkReadEvent,
  InboxRequestHistoryEvent,
  InboxSendMessageEvent,
  InboxSendResult,
} from './inbox.constants';
import { ListMessagesDto } from './dto/list-messages.dto';
import { ListThreadsDto } from './dto/list-threads.dto';
import {
  InboxMessageView,
  InboxThreadView,
  toMessageView,
  toThreadView,
} from './inbox.mapper';

/** 409 for a takeover/release blocked by another owner (R7.1, R7.6). */
function ownedByOther(owner: { id: string; name: string } | null) {
  return new HttpException(
    {
      message: owner ? `${owner.name} is handling this chat` : 'This thread is assigned to another agent',
      reason: 'thread_owned_by_other_agent',
      ownerName: owner?.name,
      ownerId: owner?.id,
    },
    HttpStatus.CONFLICT,
  );
}

/**
 * Outer bound on one agent reply's HTTP request.
 *
 * A wedged socket would otherwise hold the request open indefinitely, and the
 * agent has no way to tell "still sending" from "hung".
 */
const SEND_TIMEOUT_MS = 30 * 1000;

/** How many messages an unpaged thread open loads. */
const DEFAULT_MESSAGE_LIMIT = 50;
/** How many history messages one on-demand page requests from the channel. */
const HISTORY_PAGE_SIZE = 50;
/**
 * Minimum gap between on-demand history requests for one thread.
 *
 * Cost control: each request is a real round trip to WhatsApp, and repeated
 * bulk history pulls are the single biggest ban risk on an unofficial session
 * (which is why the engine runs with `syncFullHistory: false`). An agent
 * scroll-spamming the top of a thread must not translate into a burst of
 * fetches, so a request inside this window is refused as a no-op.
 */
const HISTORY_REQUEST_COOLDOWN_MS = 30 * 1000;

/**
 * Read side of the omnichannel inbox: the channel tabs, the thread list per
 * channel, and one thread's messages.
 *
 * WHY THIS IS THREAD-SCOPED, NOT CONVERSATION-SCOPED
 * --------------------------------------------------
 * The existing conversation endpoints cannot serve this. `active-conversations`
 * requires `type=realtime` AND an assigned agent, so a WhatsApp thread the bot
 * is handling matches nothing; `GET /conversation` excludes `in_progress`, so a
 * live thread is absent there too. On top of that a ChannelThread outlives any
 * single Conversation (a 2-hourly cron expires those), so a conversation-scoped
 * read would truncate history mid-thread.
 *
 * Reading by `channelThread` fixes all three at once, and is what
 * ConversationService.getThreadMessages was written for.
 */
@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly channelThreadService: ChannelThreadService,
    private readonly conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly inboxEventsService: InboxEventsService,
    private readonly socketStateService: SocketStateService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  /**
   * The caller's permission scope, as a list of bot ids.
   *
   * THE TENANCY SEAM. Today scoping is per-bot because no entity carries an
   * `accountId` yet. Every inbox query goes through this one method, so when
   * tenancy lands it is the only place that changes — the call sites already
   * treat the result as opaque.
   *
   * Returns `null` for an admin (unscoped). Returns an ARRAY for an agent,
   * possibly empty — and empty must mean "see nothing", never "see everything",
   * which is why the two cases are different types rather than an empty array
   * doing double duty.
   */
  private async scopeFilter(user: JwtPayload): Promise<string[] | null> {
    try {
      // Org staff see every bot of THEIR organization — never `null`
      // (unscoped), which would expose every tenant's threads.
      if (user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) {
        return (await this.tenantScope.orgBotIdStrings(user as any)) ?? [];
      }

      if (user?.role !== Role.AGENT) return [];

      // Agents see only their assigned bots, intersected with their org's bots
      // so a stale assignment to a foreign bot cannot widen the scope.
      const [agent, orgBots] = await Promise.all([
        this.agentService.findOne(user._id),
        this.tenantScope.orgBotIdStrings(user as any),
      ]);
      const allowed = new Set(orgBots ?? []);
      const bots = (agent?.assignedBots || []) as any[];
      return bots
        .map((b) => (b?._id ? b._id.toString() : b.toString()))
        .filter((id) => allowed.has(id));
    } catch (error) {
      // Fail CLOSED. A lookup failure must not silently widen the scope to
      // every tenant's threads.
      this.logger.error(
        `Scope resolution failed for user ${user?._id}: ${error?.message}`,
      );
      return [];
    }
  }

  /**
   * Channels that actually have threads, with per-channel counts.
   *
   * This is what drives the dashboard's channel tabs. Derived from the data
   * rather than a hardcoded list, so onboarding Instagram/Telegram makes a tab
   * appear with no frontend change.
   */
  async listChannels(user: JwtPayload): Promise<{
    channels: Array<{ channel: string; threads: number; unread: number }>;
  }> {
    const botIds = await this.scopeFilter(user);
    const channels = await this.channelThreadService.listChannelsWithCounts(
      botIds,
    );
    return { channels };
  }

  /**
   * Whether one channel can actually send right now, and why not if it cannot.
   *
   * This exists because the tab list lies by omission. Channels are derived from
   * ChannelThread rows, which are permanent by design — they outlive the messenger
   * that created them. So deleting, stopping or losing a WhatsApp connection leaves
   * a fully-populated tab whose threads look entirely normal, and the first an
   * agent hears of it is a failed reply. The dashboard renders this as a banner so
   * the failure is visible before they type.
   *
   * Asks the owning hub rather than reading a column: the difference between
   * "stopped", "logged out" and "reconnecting" only exists in the engine's live
   * runtime, not in the database (see WhatsappWebService.getChannelStatus).
   */
  async getChannelStatus(
    user: JwtPayload,
    channel: string,
  ): Promise<InboxChannelStatusResult> {
    const botIds = await this.scopeFilter(user);
    const query: InboxChannelStatusQuery = { channel, botIds };

    let settled: any[] = [];
    try {
      settled = await this.eventEmitter.emitAsync(
        INBOX_CHANNEL_STATUS_EVENT,
        query,
      );
    } catch (error) {
      this.logger.warn(
        `Channel status dispatch failed for "${channel}": ${error?.message}`,
      );
    }

    // Only a value that actually looks like a status counts. A listener registered
    // with the wrong options resolves to something unrelated (see the note on
    // `onInboxSendMessage`), and treating that as an answer would report a broken
    // channel as healthy.
    const result = (settled || []).find(
      (r) => r && typeof r === 'object' && 'state' in r && 'connected' in r,
    ) as InboxChannelStatusResult | undefined;

    // No hub owns this channel — `unknown`, not a fabricated `connected`. The
    // client renders nothing for `unknown`, which is the right outcome for a
    // channel whose health we cannot speak to (the widget/live chat, say).
    return (
      result ?? { channel, state: 'unknown', connected: false, accounts: [] }
    );
  }

  async listThreads(
    user: JwtPayload,
    query: ListThreadsDto,
  ): Promise<{ threads: InboxThreadView[]; nextCursor: string | null }> {
    const botIds = await this.scopeFilter(user);

    const { threads, nextCursor } = await this.channelThreadService.listThreads({
      channel: query.channel,
      botIds,
      search: query.search,
      limit: query.limit ? Number(query.limit) : undefined,
      before: query.before ? new Date(query.before) : undefined,
    });

    return { threads: threads.map(toThreadView), nextCursor };
  }

  /**
   * Load a thread and assert the caller may see it.
   *
   * Every thread-scoped route funnels through here so the ownership check cannot
   * be forgotten on a new endpoint. A thread outside the caller's scope raises
   * 404 rather than 403 — a 403 would confirm the thread exists.
   */
  private async requireThread(user: JwtPayload, threadId: string) {
    const thread = await this.channelThreadService.findByIdPopulated(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread "${threadId}" not found`);
    }

    const botIds = await this.scopeFilter(user);
    if (botIds !== null) {
      const threadBotId = thread.bot?._id
        ? thread.bot._id.toString()
        : thread.bot?.toString();
      if (!threadBotId || !botIds.includes(threadBotId)) {
        throw new NotFoundException(`Thread "${threadId}" not found`);
      }
    }

    return thread;
  }

  async getThread(
    user: JwtPayload,
    threadId: string,
  ): Promise<InboxThreadView> {
    return toThreadView(await this.requireThread(user, threadId));
  }

  /**
   * One thread's message window, oldest-first.
   *
   * `hasMore` is computed by asking for one row beyond the window, which lets
   * the client show a "load older" affordance without a second count query.
   * OpenWA's dashboard has no equivalent — its window is fixed at 100 with no
   * pagination path, so older content is only reachable through global search.
   * Cursor paging here avoids inheriting that limitation.
   */
  async getThreadMessages(
    user: JwtPayload,
    threadId: string,
    query: ListMessagesDto,
  ): Promise<{
    messages: InboxMessageView[];
    nextCursor: string | null;
    hasMore: boolean;
    historyExhausted: boolean;
  }> {
    const thread = await this.requireThread(user, threadId);
    const limit = query.limit ? Number(query.limit) : DEFAULT_MESSAGE_LIMIT;

    const rows = await this.conversationService.getThreadMessages(threadId, {
      limit: limit + 1,
      before: query.before ? new Date(query.before) : undefined,
      // Widget threads are keyed by their conversation id (R9.1).
      conversationId: thread.channel === 'widget' && thread.chatId ? String(thread.chatId) : undefined,
    });

    // getThreadMessages returns oldest-first, so the extra probe row for
    // "is there anything older" is at the FRONT, not the end.
    const hasMore = rows.length > limit;
    const messages = hasMore ? rows.slice(rows.length - limit) : rows;

    const oldest = messages[0];
    const nextCursor =
      hasMore && oldest?.time ? oldest.time.toISOString() : null;

    return {
      messages: messages.map((m) =>
        toMessageView(m, {
          botId: this.threadBotId(thread),
          visitorId: (thread as any).visitor?._id ?? (thread as any).visitor,
        }),
      ),
      nextCursor,
      hasMore,
      historyExhausted: thread.historyExhausted === true,
    };
  }

  /**
   * Send an agent reply on a channel thread.
   *
   * ORDERING, AND WHY IT IS THIS WAY
   * --------------------------------
   *   1. validate + resolve the thread (no writes yet)
   *   2. ensure a Conversation exists to hang the row on
   *   3. write the Chat_Row as `pending` with a correlation id
   *   4. ask the channel to deliver, and WAIT for the outcome
   *   5. on success stamp the channel id and announce; on failure mark it failed
   *
   * The row is written *before* the send so a message can never be delivered
   * without a local record of it — the reverse order loses the message entirely if
   * the process dies mid-send. The cost is a `pending` row for a failed send,
   * which is exactly what the agent needs to see and retry.
   */
  async sendMessage(
    user: JwtPayload,
    threadId: string,
    dto: SendInboxMessageDto,
  ): Promise<{
    correlationId: string;
    id: string;
    externalMessageId?: string;
    status: string;
  }> {
    const thread = await this.requireThread(user, threadId);

    // Owner-only replies (R7.2): on an agent-owned thread nobody else may
    // write, including a previous owner after an override. Nothing is
    // persisted or delivered on rejection.
    const ownerId = thread.assignedAgent?._id
      ? thread.assignedAgent._id.toString()
      : thread.assignedAgent?.toString();
    if (thread.handledByAgent && ownerId && ownerId !== String(user._id)) {
      const a: any = thread.assignedAgent;
      throw new HttpException(
        {
          message: 'Another agent is handling this chat',
          reason: 'not_thread_owner',
          ownerName: (a?.name || '').trim() || a?.email || 'another agent',
        },
        HttpStatus.CONFLICT,
      );
    }

    const text = dto.message?.trim();
    if (!text && !dto.mediaUrl) {
      throw new BadRequestException(
        'A reply needs either message text or a mediaUrl',
      );
    }

    // A media reply whose URL the channel cannot fetch would fail inside the
    // engine with an opaque error, so it is refused here where the reason is
    // still obvious.
    if (dto.mediaUrl && !/^https?:\/\//i.test(dto.mediaUrl)) {
      throw new BadRequestException(
        'mediaUrl must be an absolute http(s) URL the channel can fetch',
      );
    }

    const type = dto.type || (dto.mediaUrl ? ChatTypeEnum.FILE : ChatTypeEnum.TEXT);

    // A ChannelThread outlives the Conversation it points at (a 2-hourly cron
    // expires those), and `saveChannelMessage` silently no-ops without a
    // conversation id — which would drop the reply on the floor.
    const conversationId = await this.ensureConversationForThread(thread);
    if (!conversationId) {
      throw new HttpException(
        'Could not attach the reply to a conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // The CLIENT's correlation id wins when it supplies one.
    //
    // This is the join key between the optimistic bubble the dashboard rendered at
    // submit time and the echo that comes back over the socket. Minting a server-
    // side id here instead meant the echo carried an id the client had never seen,
    // so nothing folded and every reply rendered twice — once as a pending
    // placeholder that never resolved, once as the real message. Only fall back to
    // generating one for a caller that sent none (a script, or a channel hub
    // replaying).
    const correlationId = dto.correlationId || generateId('message', 10);

    const { chat } = await this.conversationService.saveChannelMessage({
      conversationId,
      message: text ?? '',
      sender: user._id,
      type,
      time: new Date(),
      channelThread: threadId,
      direction: ChatDirectionEnum.OUTBOUND,
      status: ChatStatusEnum.PENDING,
      chatId: correlationId,
      // A unique stand-in, NOT left unset. The (channelThread, externalMessageId)
      // unique index does not skip a row that has a thread but no external id — it
      // indexes it as null — so an unset value lets only one pending/failed reply
      // exist per thread and every later one collides with E11000. See
      // PENDING_EXTERNAL_ID_PREFIX. Overwritten with the channel's real id once it
      // answers.
      externalMessageId: pendingExternalId(correlationId),
      mediaUrl: dto.mediaUrl,
      mimetype: dto.mimetype,
      fileName: dto.fileName,
      quotedMessageId: dto.quotedMessageId,
    } as any);

    if (!chat) {
      throw new HttpException(
        'Could not persist the reply',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const result = await this.dispatchSend({
      channel: thread.channel,
      sessionName: thread.sessionName || '',
      chatId: thread.chatId,
      threadId,
      correlationId,
      type,
      message: text,
      mediaUrl: dto.mediaUrl,
      mimetype: dto.mimetype,
      fileName: dto.fileName,
      quotedMessageId: dto.quotedMessageId,
    });

    if (!result || !result.accepted) {
      // The row stays as evidence of the attempt and as the retry's subject.
      await this.conversationService
        .failOutboundByCorrelationId(correlationId)
        .catch(() => null);

      const reason = result?.reason ?? 'channel_send_failed';
      this.logger.warn(
        `Reply on thread ${threadId} failed (${reason}): ${result?.detail ?? 'no handler'}`,
      );
      throw new HttpException(
        { message: 'Reply could not be delivered', reason },
        this.statusForSendFailure(reason),
      );
    }

    // Bind the channel's own id onto the row we wrote, so a later receipt can
    // find it and the delivery ticks can advance.
    const linked = await this.conversationService
      .linkOutboundChannelMessage({
        correlationId,
        threadId,
        externalMessageId: result.externalMessageId,
      })
      .catch(() => null);

    await this.channelThreadService
      .touchLastMessage(threadId, {
        message: text || `[${type}]`,
        type,
        time: result.timestamp || new Date(),
        direction: ChatDirectionEnum.OUTBOUND,
        sender: user._id,
      })
      .catch(() => undefined);

    const announceRow = linked ?? chat;
    const botId = this.threadBotId(thread);
    await this.inboxEventsService
      .publishMessage({
        botId,
        channel: thread.channel,
        threadId,
        message: toMessageView(announceRow as any),
        thread: toThreadView(
          (await this.channelThreadService.findByIdPopulated(threadId)) ??
            thread,
        ),
      })
      .catch(() => undefined);

    return {
      correlationId,
      id: (announceRow._id as any).toString(),
      externalMessageId: result.externalMessageId,
      status: (announceRow as any).status ?? ChatStatusEnum.SENT,
    };
  }

  /**
   * Ask whichever hub owns this channel to deliver, and wait for its answer.
   *
   * `emitAsync` returns every listener's resolved value; hubs return `null` for a
   * channel they do not own, so at most one meaningful result comes back. The
   * timeout is the outer bound on the whole HTTP request — without it a wedged
   * socket would hold the agent's request open indefinitely.
   */
  private async dispatchSend(
    payload: InboxSendMessageEvent,
  ): Promise<InboxSendResult | null> {
    const timeout = new Promise<InboxSendResult>((resolve) =>
      setTimeout(
        () => resolve({ accepted: false, reason: 'channel_send_timeout' }),
        SEND_TIMEOUT_MS,
      ),
    );

    try {
      const settled = await Promise.race([
        this.eventEmitter.emitAsync(INBOX_SEND_MESSAGE_EVENT, payload),
        timeout,
      ]);

      // The timeout branch resolves to a result object; the emit branch to an array.
      if (!Array.isArray(settled)) return settled;

      // Only a value that actually looks like a result counts. A listener
      // registered with the wrong options can resolve to something unrelated (a
      // Timeout, undefined), and treating that as an outcome is how a delivered
      // message gets reported as failed. Anything unrecognised is "no handler
      // answered", which is a different and honest failure.
      const result = settled.find(
        (r) => r && typeof r === 'object' && 'accepted' in r,
      ) as InboxSendResult | undefined;

      return result ?? null;
    } catch (error) {
      this.logger.error(`Send dispatch failed: ${error?.message}`);
      return {
        accepted: false,
        reason: 'channel_send_failed',
        detail: error?.message,
      };
    }
  }

  /**
   * Map a failure reason to an HTTP status.
   *
   * Split by whose problem it is: a request the channel will never accept is the
   * caller's (4xx) and retrying it unchanged is pointless; a session or transport
   * fault is ours (5xx) and the same request may well succeed later.
   */
  private statusForSendFailure(reason: string): number {
    switch (reason) {
      case 'session_not_connected':
      case 'no_reply_target':
        return HttpStatus.CONFLICT;
      case 'invalid_send_request':
      case 'unsupported_media':
      case 'outside_service_window':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'rate_limited':
        return HttpStatus.TOO_MANY_REQUESTS;
      case 'channel_send_timeout':
        return HttpStatus.GATEWAY_TIMEOUT;
      default:
        return HttpStatus.BAD_GATEWAY;
    }
  }

  /**
   * The conversation a new message on this thread belongs to.
   *
   * Reuses the thread's current conversation while it is still open, and otherwise
   * creates a fresh one bound to the same visitor — which is the normal case for a
   * thread that has been quiet longer than the 2-hourly expiry cron.
   */
  private async ensureConversationForThread(thread: any): Promise<string | null> {
    const current = thread.conversation
      ? thread.conversation.toString()
      : null;

    if (current) {
      const status = await this.conversationService
        .getConversationStatus(current)
        .catch(() => null);
      if (status === ConversationStatusEnum.IN_PROGRESS) return current;
    }

    const visitorId = thread.visitor?._id
      ? thread.visitor._id.toString()
      : thread.visitor?.toString();
    const botId = this.threadBotId(thread);
    if (!visitorId || !botId) {
      // No visitor yet means no inbound message has ever been processed on this
      // thread — an agent-first outbound needs the bot runtime to have seeded one.
      this.logger.warn(
        `Thread ${thread._id} has no visitor; cannot attach a conversation`,
      );
      return null;
    }

    const conversation = await this.conversationService.createConversation({
      bot: botId,
      type: ConversationTypeEnum.BOT,
      visitor: visitorId,
      platform: thread.channel,
    } as any);

    await this.channelThreadService.attachConversation(
      (thread._id as any).toString(),
      { conversation: conversation.id },
    );

    return conversation.id;
  }

  /**
   * A widget chat became a live chat (Live Chat tab): its Web Chat thread is
   * owned by the same agent, so the Web Chat view shows who handles it and
   * another agent's "Take over" is refused instead of splitting the chat.
   * Never throws; a thread someone else owns is left alone.
   */
  @OnEvent(LIVE_CHAT_CONNECTED, { async: true })
  async onLiveChatConnected(p: { threadId: string; agentId: string }) {
    try {
      if (!p?.threadId || !p.agentId) return;
      const res = await this.channelThreadService.claim(p.threadId, p.agentId);
      if (res.ok === false || !res.changed) return;
      const fresh = await this.channelThreadService.findByIdPopulated(p.threadId);
      if (!fresh) return;
      await this.inboxEventsService
        .publishThreadUpdated({ botId: this.threadBotId(fresh), channel: fresh.channel, thread: toThreadView(fresh) })
        .catch(() => undefined);
    } catch {
      // Best effort: the live chat itself is already connected.
    }
  }

  /** Bot id from a thread whose `bot` may or may not be populated. */
  private threadBotId(thread: any): string | undefined {
    if (!thread?.bot) return undefined;
    return thread.bot._id ? thread.bot._id.toString() : thread.bot.toString();
  }

  /**
   * Pause/resume the bot, or take the thread over / hand it back.
   *
   * `botEnabled` and `action` are mutually exclusive: `assignToAgent` and
   * `releaseToBot` each write `botEnabled` themselves, so honouring both in one
   * request would make the result depend on application order.
   */
  async setBotControl(
    user: JwtPayload,
    threadId: string,
    dto: BotControlDto,
  ): Promise<InboxThreadView> {
    const thread = await this.requireThread(user, threadId);

    const hasFlag = dto.botEnabled !== undefined;
    const hasAction = !!dto.action;

    if (hasFlag && hasAction) {
      throw new BadRequestException({
        message: 'Send either botEnabled or action, not both',
        reason: 'ambiguous_bot_control',
      });
    }
    if (!hasFlag && !hasAction) {
      throw new BadRequestException({
        message: 'Send botEnabled or action',
        reason: 'no_bot_control_field',
      });
    }

    let changed = true;
    if (hasAction) {
      // Takeover and release are single conditional writes (R7.1, R7.6).
      // Admins get no bypass here (R7.4): stealing a chat is the explicit
      // override action instead.
      if (dto.action === 'takeover') {
        const res = await this.channelThreadService.claim(threadId, user._id);
        if (res.ok === false) throw ownedByOther(res.owner);
        changed = res.changed;
        // Clears the open Handover_Alert (if any) for every recipient.
        this.eventEmitter.emit('inbox.thread.acknowledged', {
          threadId,
          userId: user._id,
          resolution: 'taken_over',
        });
      } else {
        const res = await this.channelThreadService.releaseIfOwner(threadId, user._id);
        if (res.ok === false) throw ownedByOther(res.owner);
        changed = res.changed;
      }
      if (dto.action === 'release' && changed) {
        // crm-incident-handover R10.2: the incident stays open; the release is
        // recorded and a later takeover is announced to the visitor again.
        if (thread.channel === 'widget' && thread.chatId) {
          this.eventEmitter.emit('agent.released', {
            conversationId: String(thread.chatId),
            agentId: String(user._id),
            visitorId: thread.visitor?._id
              ? thread.visitor._id.toString()
              : thread.visitor?.toString(),
          });
        }
      }
    } else {
      await this.channelThreadService.setBotEnabled(threadId, dto.botEnabled);
    }

    const fresh =
      (await this.channelThreadService.findByIdPopulated(threadId)) ?? thread;

    // Keep the in-memory bot runtime in step. `routeToBotOrAgent` treats the
    // thread as authoritative, but it also reads socket state, and leaving the two
    // disagreeing would route the next inbound message by stale ownership.
    this.syncSocketStateOwnership(fresh);

    // crm-incident-handover R19.4: a widget visitor is told the agent's name,
    // and the open incident becomes agent_active. Widget threads key the
    // conversation id as chatId.
    if (dto.action === 'takeover' && changed && fresh.channel === 'widget') {
      const visitorId = fresh.visitor?._id
        ? fresh.visitor._id.toString()
        : fresh.visitor?.toString();
      if (visitorId) {
        this.eventEmitter.emit('agent.took.over', {
          visitorId,
          conversationId: fresh.chatId ? String(fresh.chatId) : undefined,
          agentId: String(user._id),
          agentName: (fresh.assignedAgent as any)?.name,
        });
      }
    }

    // Exactly one event per real change, none for a no-op (R7.5).
    if (changed) {
      await this.inboxEventsService
        .publishThreadUpdated({
          botId: this.threadBotId(fresh),
          channel: fresh.channel,
          thread: toThreadView(fresh),
        })
        .catch(() => undefined);
    }

    return toThreadView(fresh);
  }

  /**
   * Admin override (R7.3, R7.7): an org admin takes the chat, or gives it to
   * an agent assigned to the bot, even when someone else owns it. Separate
   * from takeover, recorded on the incident (or conversation), and the
   * previous owner is told who did it.
   */
  async overrideOwner(
    user: JwtPayload,
    threadId: string,
    targetAgentId?: string,
  ): Promise<InboxThreadView> {
    if (user?.role !== Role.ORG_ADMIN) {
      throw new HttpException(
        { message: 'Only an org admin can override ownership', reason: 'override_not_admin' },
        HttpStatus.FORBIDDEN,
      );
    }
    const thread = await this.requireThread(user, threadId);
    const botId = this.threadBotId(thread);
    const toId = String(targetAgentId || user._id);

    if (toId !== String(user._id)) {
      const target: any = await this.agentService.findOne(toId).catch(() => null);
      const assigned = (target?.assignedBots || []).some(
        (b: any) => String(b?._id ?? b) === String(botId),
      );
      const sameOrg = String(target?.organizationId ?? '') === String((user as any).organizationId ?? '');
      if (!target || !sameOrg || !assigned || target.active === false) {
        throw new BadRequestException({
          message: 'That agent is not active or not assigned to this bot',
          reason: 'override_invalid_target',
        });
      }
    }

    const prev = await this.channelThreadService.ownerOf(threadId);
    const res = await this.channelThreadService.overrideOwner(threadId, prev?.id ?? null, toId);
    if (res.ok === false) {
      // Ownership moved while the admin was confirming; let them look again.
      throw new HttpException(
        {
          message: 'Ownership changed, review and try again',
          reason: 'ownership_changed',
          ownerName: res.owner?.name,
        },
        HttpStatus.CONFLICT,
      );
    }

    const fresh = (await this.channelThreadService.findByIdPopulated(threadId)) ?? thread;
    this.syncSocketStateOwnership(fresh);
    if (!res.changed) return toThreadView(fresh);

    const at = new Date();
    this.eventEmitter.emit('inbox.ownership.overridden', {
      threadId,
      conversationId: fresh.channel === 'widget' && fresh.chatId ? String(fresh.chatId) : undefined,
      from: prev?.id ?? null,
      to: toId,
      actor: String(user._id),
      at,
    });
    if (prev?.id && prev.id !== toId) {
      this.inboxEventsService.emitToUsers(
        [prev.id],
        'inbox:ownership-overridden',
        { threadId, actorId: String(user._id), actorName: (user as any).name || (user as any).email, at },
      );
    }
    if (fresh.channel === 'widget') {
      const visitorId = fresh.visitor?._id ? fresh.visitor._id.toString() : fresh.visitor?.toString();
      if (visitorId) {
        this.eventEmitter.emit('agent.took.over', {
          visitorId,
          conversationId: fresh.chatId ? String(fresh.chatId) : undefined,
          agentId: toId,
          agentName: (fresh.assignedAgent as any)?.name,
        });
      }
    }
    await this.inboxEventsService
      .publishThreadUpdated({ botId, channel: fresh.channel, thread: toThreadView(fresh) })
      .catch(() => undefined);
    return toThreadView(fresh);
  }

  /**
   * Mirror a thread's committed ownership onto the visitor's in-memory state.
   *
   * Best-effort: the durable thread is the authority, and an absent state entry
   * just means the conversation is idle and will be rebuilt from the thread on the
   * next inbound message.
   */
  private syncSocketStateOwnership(thread: any): void {
    const visitorId = thread.visitor?._id
      ? thread.visitor._id.toString()
      : thread.visitor?.toString();
    if (!visitorId) return;

    const assignedAgentId = thread.assignedAgent?._id
      ? thread.assignedAgent._id.toString()
      : thread.assignedAgent?.toString();

    try {
      this.socketStateService.updateUserData(visitorId, {
        handledByAgent: thread.handledByAgent === true,
        assignedAgentId: assignedAgentId || undefined,
      });
    } catch (error) {
      this.logger.warn(
        `Could not sync socket state for visitor ${visitorId}: ${error?.message}`,
      );
    }
  }

  /**
   * Mark a thread read: clear our badge and send the customer's blue ticks.
   *
   * The local badge is cleared unconditionally; the channel-side receipt is
   * best-effort, published as an event so this module stays free of any engine
   * import. WhatsApp acknowledges individual message ids rather than a
   * read-up-to watermark, so the ids are collected here and passed along.
   */
  async markThreadRead(
    user: JwtPayload,
    threadId: string,
  ): Promise<{ success: true; acknowledged: number }> {
    const thread = await this.requireThread(user, threadId);

    await this.channelThreadService.markRead(threadId);

    // Selecting a thread in the inbox calls this endpoint, so it doubles as
    // "an alert recipient opened the handover" (Req 7.3).
    this.eventEmitter.emit('inbox.thread.acknowledged', {
      threadId,
      userId: user._id,
      resolution: 'opened',
    });

    // Only inbound messages can be unread by us, and only ones the channel gave
    // an id to can be acknowledged back. Bounded to the recent window so a
    // thread with a long backfill does not build a huge receipt payload.
    const recent = await this.conversationService.getThreadMessages(threadId, {
      limit: DEFAULT_MESSAGE_LIMIT,
    });
    const externalMessageIds = recent
      .filter(
        (m) =>
          m.direction === ChatDirectionEnum.INBOUND &&
          !!m.externalMessageId &&
          m.historical !== true,
      )
      .map((m) => m.externalMessageId);

    if (externalMessageIds.length) {
      const payload: InboxMarkReadEvent = {
        channel: thread.channel,
        sessionName: thread.sessionName || '',
        chatId: thread.chatId,
        externalMessageIds,
      };
      this.eventEmitter.emit(INBOX_MARK_READ_EVENT, payload);
    }

    return { success: true, acknowledged: externalMessageIds.length };
  }

  /**
   * Ask the channel for an older page of this thread's history.
   *
   * Returns `requested: false` with a reason rather than throwing, because every
   * refusal here is an expected, benign outcome the UI should render as "nothing
   * older" or "just a moment" — not an error.
   *
   * COST CONTROL, and the reason this is on-demand at all:
   *  - `syncFullHistory` is off on the engine, so we never pay for a bulk
   *    transfer of every chat at pairing time. History is pulled per thread,
   *    only when an agent actually scrolls back into one.
   *  - `historyExhausted` short-circuits permanently once the channel says
   *    there is nothing older, so a thread cannot be re-requested forever.
   *  - A cooldown collapses scroll-spam into one request per window.
   *  - The reply arrives asynchronously via the channel's history event and is
   *    persisted by the existing inbound path, so pages are stored once and
   *    served from our DB thereafter — each message is fetched from WhatsApp at
   *    most once, ever.
   */
  async requestOlderHistory(
    user: JwtPayload,
    threadId: string,
  ): Promise<{ requested: boolean; reason?: string }> {
    const thread = await this.requireThread(user, threadId);

    if (thread.historyExhausted === true) {
      return { requested: false, reason: 'history_exhausted' };
    }

    if (thread.historyRequestedAt) {
      const elapsed = Date.now() - new Date(thread.historyRequestedAt).getTime();
      if (elapsed < HISTORY_REQUEST_COOLDOWN_MS) {
        return { requested: false, reason: 'cooldown' };
      }
    }

    // The channel needs the oldest message we hold as the cursor to page back
    // from. No messages at all means there is nothing to anchor a request to.
    const oldest = await this.conversationService.getOldestThreadMessage(
      threadId,
    );
    if (!oldest?.externalMessageId || !oldest.time) {
      return { requested: false, reason: 'no_cursor' };
    }

    // Written before dispatch so the cooldown holds even if the channel is slow
    // or the request fails — a failing channel must not become a retry loop.
    await this.channelThreadService.markHistoryRequested(threadId);

    const payload: InboxRequestHistoryEvent = {
      channel: thread.channel,
      sessionName: thread.sessionName || '',
      chatId: thread.chatId,
      threadId,
      oldest: {
        externalMessageId: oldest.externalMessageId,
        time: oldest.time,
        fromMe: oldest.direction === ChatDirectionEnum.OUTBOUND,
      },
      count: HISTORY_PAGE_SIZE,
    };
    this.eventEmitter.emit(INBOX_REQUEST_HISTORY_EVENT, payload);

    return { requested: true };
  }
}
