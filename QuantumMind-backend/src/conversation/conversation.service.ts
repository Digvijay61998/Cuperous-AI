import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ObjectId } from "bson";
import { Model, Types } from "mongoose";
import {
  CHAT_PROVIDER,
  CONVERSATION_ACTIVITIES_PROVIDER,
  CONVERSATION_PROVIDER,
} from "./constant";
import { CreateChatDto } from "./dto/create-chat.dto";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import {
  ChatDocument,
  PENDING_EXTERNAL_ID_PREFIX,
} from "./entities/chat.entity";
import { ConversationDocument } from "./entities/conversation.entity";
import { ConversationTypeEnum } from "./enums/conversation-type.enum";

import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { Cron, CronExpression } from "@nestjs/schedule";
import { isCreditCard, isEmail } from "class-validator";
import moment from "moment";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { ConversationActivitiesDocument } from "./entities/conversation-activities.entity";
import { ConversationStatusEnum } from "./enums/conversation-status.enum";
import { PlatformEnum } from "./enums/platform.enum";
import {
  allowedPreviousStatuses,
  ChatStatusEnum,
} from "./enums/chat-status.enum";
import { ChatDirectionEnum } from "./enums/chat-direction.enum";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { TenantContext } from "src/common/tenant/tenant-context";
import { ENDED_STATE_CAUSES } from "./ended-state";

@Injectable()
export class ConversationService {
  private logger = new Logger("ConversationService");
  constructor(
    @Inject(CONVERSATION_PROVIDER)
    private readonly conversationModel: Model<ConversationDocument>,

    @Inject(CHAT_PROVIDER)
    private readonly chatModel: Model<ChatDocument>,

    @Inject(CONVERSATION_ACTIVITIES_PROVIDER)
    private readonly conversationActivitiesModel: Model<ConversationActivitiesDocument>,

    private readonly eventEmitter: EventEmitter2,

    private readonly tenantScope: TenantScopeService
  ) {}

  // onModuleInit() {
  //   console.log('ConversationService initialized');
  //   console.log(this.maskMessage('1234567890'));
  //   console.log(this.maskMessage('nitesh'));
  //   console.log(this.maskMessage('4315813084463007'));
  //   console.log(this.maskMessage('4315 8130 8446 3007'));
  //   console.log(this.maskMessage('4315-8130-8446-3007'));
  //   console.log(this.maskMessage('10/12/2020'));
  //   console.log(this.maskMessage('2022/12/20'));

  //   console.log(this.maskMessage(''));
  //   console.log(this.maskMessage('123'));
  //   console.log(this.maskMessage('12345678901234567890'));
  //   console.log(this.maskMessage('123456789012345678901234567890'));
  //   console.log(this.maskMessage('1234567890123456789012345678901234567890'));
  //   console.log(
  //     this.maskMessage('12345678901234567890123456789012345678901234567890'),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '1234567890123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(this.maskMessage('nitesh@mollatech.com'));
  // }

  @OnEvent("create.new.chat", { async: true })
  async createChat(createChatDto: CreateChatDto) {
    try {
      if (!createChatDto.conversationId) return;
      const chat = await this.chatModel.create({
        ...createChatDto,
        // Channel messages carry their own timestamp (a history backfill must
        // keep the ORIGINAL time, not "now", or months-old messages sort to the
        // bottom of the thread). Widget/bot chats pass none and still get now.
        time: createChatDto.time || new Date(),
      });
      await this.pushChatToConversation(createChatDto.conversationId, chat._id);

      // Let the omnichannel inbox mirror this into a ChannelThread + realtime
      // fan-out. Fire-and-forget and handled by WidgetInboxBridgeService, which
      // filters to the widget platform — the social channels build their own
      // threads in their inbound pipelines, so this must not double-handle them.
      // Announcing here (rather than from every create.new.chat emit site) keeps
      // the one persistence path as the single source of truth for the inbox.
      this.eventEmitter.emit("chat.persisted", {
        chatId: (chat._id as any).toString(),
        conversationId: createChatDto.conversationId,
      });

      return chat;
    } catch (error) {
      // A duplicate key here is the dedup index doing its job: the engine
      // re-fired a message we already stored (reconnect replay, history overlap
      // with a live message). That is an expected, benign outcome — swallow it
      // instead of logging an error and rethrowing into the event emitter,
      // where a rejection would be an unhandled promise.
      if (this.isDuplicateKeyError(error)) {
        this.logger.debug(
          `Skipped duplicate chat ${createChatDto.externalMessageId} on thread ${createChatDto.channelThread}`
        );
        return null;
      }
      this.logger.error(`Error in creating chat ${error.message}`);
      throw error;
    }
  }

  /** Mongo duplicate-key (E11000) — raised by the sparse unique dedup index. */
  private isDuplicateKeyError(error: any): boolean {
    return error?.code === 11000 || error?.code === 11001;
  }

  /**
   * Persist a channel (WhatsApp/Telegram/...) message and return the stored row.
   *
   * Unlike the fire-and-forget `create.new.chat` event, callers of this need the
   * outcome: whether the row was newly created (so the message may be published
   * onward and fed to the bot) or was a duplicate re-fire (so it must not be).
   * That distinction is what keeps "persist, then publish exactly once" honest.
   *
   * Returns `{ chat, created }`; `created: false` means a row already existed.
   */
  async saveChannelMessage(
    dto: CreateChatDto
  ): Promise<{ chat: ChatDocument | null; created: boolean }> {
    if (!dto.conversationId) return { chat: null, created: false };
    try {
      const chat = await this.chatModel.create({
        ...dto,
        time: dto.time || new Date(),
      });
      await this.pushChatToConversation(
        dto.conversationId,
        chat._id as unknown as string
      );
      return { chat, created: true };
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        // Resolve the row that already holds this identity so the caller gets
        // something usable rather than a bare null.
        //
        // Falls back to the correlation id when there is no external id to match
        // on: an outbound row written before the channel answered is identified by
        // `chatId`, and returning null for it made the agent-reply path report
        // "could not persist" for a message that was, in fact, already stored.
        const existing = dto.externalMessageId
          ? await this.chatModel.findOne({
              channelThread: dto.channelThread,
              externalMessageId: dto.externalMessageId,
            })
          : dto.chatId
          ? await this.chatModel.findOne({ chatId: dto.chatId })
          : null;
        return { chat: existing, created: false };
      }
      this.logger.error(`Error saving channel message: ${error.message}`);
      throw error;
    }
  }

  /**
   * One stored channel message, by thread and channel-native id.
   *
   * Used to recognise the echo of a message we sent ourselves: WhatsApp replays it
   * through the inbound path with `fromMe: true`, and without this check the
   * pipeline would insert a second row and the dashboard would show the reply
   * twice.
   */
  async findChannelMessage(
    threadId: string,
    externalMessageId: string
  ): Promise<ChatDocument | null> {
    if (!threadId || !externalMessageId) return null;
    return this.chatModel.findOne({
      channelThread: threadId,
      externalMessageId,
    });
  }

  /**
   * Mark an outbound row failed, matched on its correlation id.
   *
   * A reply that never reached the channel has no `externalMessageId`, so
   * `advanceChannelMessageStatus` (which matches on that field) cannot touch it —
   * this is the only way such a row can leave `pending`.
   *
   * The `status: { $in: allowedPrevious }` guard is the same forward-only rule
   * applied in the query rather than in a read-then-write: a row that has somehow
   * already reached `delivered` or `read` is evidence the channel did take the
   * message, and a late local failure must not contradict that.
   */
  async failOutboundByCorrelationId(
    correlationId: string
  ): Promise<ChatDocument | null> {
    if (!correlationId) return null;
    return this.chatModel.findOneAndUpdate(
      {
        chatId: correlationId,
        // Eligible when the row is still unconfirmed. The agent path writes
        // `pending`; the bot path writes NO status at all (it never joined the
        // delivery ladder), so an absent status must also qualify — otherwise a
        // rejected bot reply could never be marked failed and would sit
        // status-less forever. A row already at delivered/read is excluded: it is
        // evidence the channel took the message and a late failure must not undo
        // that.
        $or: [
          { status: { $in: allowedPreviousStatuses(ChatStatusEnum.FAILED) } },
          { status: { $exists: false } },
          { status: null },
        ],
      },
      { $set: { status: ChatStatusEnum.FAILED } },
      { new: true }
    );
  }

  /**
   * Advance the delivery status of an outbound channel message (the double-tick
   * ladder), refusing any move that would go backwards.
   *
   * The guard lives in the query (`status: { $in: allowedPrevious }`) rather
   * than in a read-then-write, so concurrent receipts cannot interleave into a
   * downgrade: WhatsApp replays receipts after a reconnect, so a `delivered`
   * can legitimately arrive after `read`.
   *
   * Returns the updated row, or null when nothing advanced (unknown message, or
   * the status was already at/ahead of the target).
   */
  async advanceChannelMessageStatus(
    externalMessageId: string,
    status: string,
    threadId?: string
  ): Promise<ChatDocument | null> {
    if (!externalMessageId || !status) return null;
    const allowedPrevious = allowedPreviousStatuses(status);
    if (!allowedPrevious.length) return null;

    const filter: Record<string, any> = {
      externalMessageId,
      // An unset status (inbound rows, legacy widget rows) must not be advanced;
      // only rows already on the ladder are eligible.
      status: { $in: allowedPrevious },
    };
    if (threadId) filter.channelThread = threadId;

    return this.chatModel.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true }
    );
  }

  /**
   * Read a channel thread's history, newest-first, optionally paging backwards
   * from a timestamp cursor.
   *
   * Reads by `channelThread` rather than by conversation on purpose: a WhatsApp
   * thread outlives any single Conversation (the 2-hourly cron expires those),
   * so scoping to one conversation would truncate the history an agent sees
   * mid-thread.
   */
  async getThreadMessages(
    threadId: string,
    options: { limit?: number; before?: Date; conversationId?: string } = {}
  ) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    // A widget thread is exactly one conversation. Reading by conversation
    // includes every row, even one whose thread stamp was lost (the bridge
    // stamps rows one by one as they are mirrored), so the agent sees the
    // full history from before the handover (crm-incident-handover R9.1, R9.8).
    const filter: Record<string, any> =
      options.conversationId && Types.ObjectId.isValid(options.conversationId)
        ? {
            $or: [
              { channelThread: threadId },
              { conversationId: new Types.ObjectId(options.conversationId) },
            ],
          }
        : { channelThread: threadId };
    if (options.before) {
      filter.time = { $lt: options.before };
    }
    const messages = await this.chatModel
      .find(filter)
      .sort({ time: -1 })
      .limit(limit);
    // Hand back oldest-first so the UI can append without reversing.
    return messages.reverse();
  }

  /**
   * Just the status of one conversation.
   *
   * Exists so the per-message inbound path does not have to call
   * `getConversationById`, which populates chats, visitor, bot, feedbacks and
   * activities — an expensive multi-join to answer a one-field question, paid on
   * every single incoming message.
   */
  /**
   * Facts the widget resume decision needs (crm-incident-handover R9.3).
   * Ended_State is read from `endedAt` / an `awaitingClosure`-closed marker.
   */
  async resumeFacts(id: string): Promise<{
    id: string;
    botId: string;
    visitorId: string;
    status: string;
    ended: boolean;
    flowNodeId?: string;
    hasChats: boolean;
    attributes?: Record<string, unknown>;
    awaitingClosure?: { sentAt: Date; idleMinutes?: number };
  } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const c: any = await this.conversationModel
      .findById(id)
      .select("bot visitor status endedAt endCause flowPosition chats activities awaitingClosure")
      .lean();
    if (!c) return null;
    return {
      id: String(c._id),
      botId: String(c.bot),
      visitorId: String(c.visitor),
      status: c.status,
      // Closed by the visitor / the closure flow (R14.7). An expiry or a
      // disconnect is not an Ended_State: those start fresh (R9.11).
      ended: !!c.endedAt && ENDED_STATE_CAUSES.has(String(c.endCause)),
      flowNodeId: c.flowPosition?.nodeId,
      hasChats: Array.isArray(c.chats) && c.chats.length > 0,
      awaitingClosure: c.awaitingClosure?.sentAt ? c.awaitingClosure : undefined,
    };
  }

  /**
   * Persist (or clear, with `null`) a pending Closure_Prompt so the idle
   * close survives a restart or a closed tab (R14.5). Never throws.
   */
  async setAwaitingClosure(
    id: string,
    state: { sentAt: Date; idleMinutes: number; closingMessage?: string } | null
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) return;
      await this.conversationModel.updateOne(
        state ? { _id: id, endedAt: { $exists: false } } : { _id: id },
        state ? { $set: { awaitingClosure: state } } : { $unset: { awaitingClosure: "" } }
      );
    } catch (error) {
      this.logger.warn(`awaitingClosure update failed: ${error?.message}`);
    }
  }

  /**
   * Open conversations whose Closure_Prompt is at least 1 minute old (the
   * smallest idle setting). The caller applies each one's own idle minutes.
   */
  async findClosureCandidates(now: Date, limit = 200): Promise<
    { id: string; visitorId: string; sentAt: Date; idleMinutes?: number; closingMessage?: string }[]
  > {
    const rows: any[] = await this.conversationModel
      .find({
        "awaitingClosure.sentAt": { $lte: new Date(now.getTime() - 60_000) },
        status: ConversationStatusEnum.IN_PROGRESS,
        endedAt: { $exists: false },
      })
      .select("visitor awaitingClosure")
      .sort({ "awaitingClosure.sentAt": 1 })
      .limit(limit)
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      visitorId: String(r.visitor),
      sentAt: r.awaitingClosure.sentAt,
      idleMinutes: r.awaitingClosure.idleMinutes,
      closingMessage: r.awaitingClosure.closingMessage,
    }));
  }

  /**
   * Claim one idle close: clears the prompt only if it is still the same
   * one. Exactly one claimer wins across instances and against a visitor
   * answer that cleared it first (R14.1 "first response", R14.5 "once").
   */
  async claimClosure(id: string, sentAt: Date): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await this.conversationModel.updateOne(
      { _id: id, "awaitingClosure.sentAt": sentAt, endedAt: { $exists: false } },
      { $unset: { awaitingClosure: "" } }
    );
    return ((res as any)?.modifiedCount ?? 0) === 1;
  }

  /** Debounced by the caller: persist where the flow is (design §7). */
  async setFlowPosition(id: string, nodeId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id) || !nodeId) return;
    await this.conversationModel
      .updateOne(
        { _id: id, status: ConversationStatusEnum.IN_PROGRESS },
        { $set: { flowPosition: { nodeId: String(nodeId), updatedAt: new Date() } } }
      )
      .catch((error) => this.logger.warn(`flowPosition update failed: ${error?.message}`));
  }

  async getConversationStatus(id: string): Promise<string | null> {
    const conversation = await this.conversationModel.findById(id, {
      status: 1,
    });
    return conversation?.status ?? null;
  }

  /**
   * Lean routing fields for one conversation — bot, platform, visitor — without
   * the expensive populate `getConversationById` does. Used by the widget inbox
   * bridge to decide whether a persisted chat belongs on a channel thread.
   */
  async getConversationRouting(id: string): Promise<{
    _id: string;
    bot?: string;
    visitor?: string;
    platform?: string;
    channelThread?: string;
  } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const conv = await this.conversationModel.findById(id, {
      bot: 1,
      visitor: 1,
      platform: 1,
      channelThread: 1,
    });
    if (!conv) return null;
    return {
      _id: String(conv._id),
      bot: conv.bot ? String(conv.bot) : undefined,
      visitor: (conv as any).visitor ? String((conv as any).visitor) : undefined,
      platform: (conv as any).platform,
      channelThread: (conv as any).channelThread
        ? String((conv as any).channelThread)
        : undefined,
    };
  }

  /** One chat row by id (no populate). For the inbox bridge's announce step. */
  async getChatById(id: string): Promise<ChatDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.chatModel.findById(id);
  }

  /** Stamp the resolved ChannelThread onto a conversation + its chat row. */
  async bindChatToThread(
    conversationId: string,
    chatId: string,
    threadId: string
  ): Promise<void> {
    await Promise.all([
      this.conversationModel.updateOne(
        { _id: conversationId },
        { $set: { channelThread: threadId } }
      ),
      this.chatModel.updateOne(
        { _id: chatId },
        { $set: { channelThread: threadId } }
      ),
    ]);
  }

  /** Oldest stored message on a thread — the cursor for on-demand history. */
  async getOldestThreadMessage(threadId: string): Promise<ChatDocument | null> {
    return this.chatModel
      .findOne({ channelThread: threadId })
      .sort({ time: 1 });
  }

  /**
   * Attach channel identity to an outbound row that the bot/agent path already
   * wrote, matching on the correlation id both sides share (`Chat.chatId`).
   *
   * WHY A CORRELATION ID
   * --------------------
   * An outbound message is written by one path (the generic
   * `create.new.chat` event, which knows the text but not the WhatsApp id) and
   * actually sent by another (the channel delivery handler, which learns the
   * WhatsApp id only from the send result). They meet on the message id that
   * MessageHandlerService generates, which is carried into `Chat.chatId`.
   *
   * Without this link the row would have no `channelThread`, so it would be
   * missing from the thread history the agent reads, and no `externalMessageId`,
   * so no delivery receipt could ever match it.
   *
   * Upserts deliberately: the send can complete before the row is written (the
   * two paths are independent async listeners), so a missing row is created
   * rather than losing the message.
   */
  async linkOutboundChannelMessage(params: {
    correlationId?: string;
    threadId?: string;
    externalMessageId: string;
    conversationId?: string;
    message?: string;
    type?: string;
    sender?: string;
    time?: Date;
  }): Promise<ChatDocument | null> {
    const { correlationId, threadId, externalMessageId } = params;
    if (!externalMessageId) return null;

    const set: Record<string, any> = {
      externalMessageId,
      direction: ChatDirectionEnum.OUTBOUND,
      status: ChatStatusEnum.SENT,
    };
    if (threadId) set.channelThread = threadId;

    if (correlationId) {
      const updated = await this.chatModel.findOneAndUpdate(
        {
          chatId: correlationId,
          // Never overwrite a row that already carries a REAL channel id — that
          // would be a different message sharing a correlation id.
          //
          // A locally-minted `pending:` placeholder is different: it exists only
          // to keep the unique index's (thread, null) slot from being contended
          // (see PENDING_EXTERNAL_ID_PREFIX), and replacing it with the channel's
          // own id is exactly this method's job. Matching only on
          // `$exists: false` missed those rows entirely, so a reply written by the
          // agent path could never be linked and stayed `pending` forever.
          $or: [
            { externalMessageId: { $exists: false } },
            {
              externalMessageId: {
                $regex: `^${PENDING_EXTERNAL_ID_PREFIX}`,
              },
            },
          ],
        },
        { $set: set },
        { new: true }
      );
      if (updated) return updated;
    }

    // The row is not there (yet). Only create one if we know where it belongs.
    if (!params.conversationId) return null;
    try {
      const chat = await this.chatModel.create({
        conversationId: params.conversationId,
        message: params.message ?? "",
        sender: params.sender,
        type: params.type,
        chatId: correlationId,
        time: params.time || new Date(),
        ...set,
      });
      await this.pushChatToConversation(
        params.conversationId,
        chat._id as unknown as string
      );
      return chat;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) return null;
      throw error;
    }
  }

  maskMessage(message: string) {
    if (!message || message.length < 1) return message;
    const length = message.length;
    if (isEmail(message)) {
      const [email, domain] = message.split("@");
      return `${email.slice(0, 2)}*****@${domain}`;
    }
    if (isCreditCard(message)) {
      return `****${message.slice(-4)}`;
    }

    if (length < 4) return `${message.slice(0, 1)}${"*".repeat(length - 1)}`;
    if (length < 10)
      return `${message.slice(0, 2)}${"*".repeat(length - 4)}${message.slice(
        -2
      )}`;
    if (length < 16)
      return `${message.slice(0, 4)}${"*".repeat(length - 8)}${message.slice(
        -4
      )}`;
    else
      return `${message.slice(0, 6)}${"*".repeat(length - 12)}${message.slice(
        -6
      )}`;
  }

  @OnEvent("mask.chat", { async: true })
  async maskChat(chatId: string) {
    try {
      const chat = await this.chatModel.findOne({ chatId });
      if (!chat) return;
      chat.message = this.maskMessage(chat.message);
      chat.secured = true;
      await chat.save();
      return chat;
    } catch (error) {
      this.logger.error(`Error in masking chat ${error.message}`);
      throw error;
    }
  }

  /**
   * Find the visitor's open conversation of this type, or create one.
   * `forceNew` (widget "Start new chat", or an ended/expired resume) always
   * creates: an earlier conversation and its chats are never reused or
   * touched (crm-incident-handover R9.11, R14).
   */
  async createConversation(createConversationDto: CreateConversationDto, opts: { forceNew?: boolean } = {}) {
    try {
      const query = {
        visitor: createConversationDto.visitor,
        type: createConversationDto.type,
      };

      if (createConversationDto.type === ConversationTypeEnum.REALTIME) {
        query["agent"] = createConversationDto.agent;
      }
      // Newest open one only; an ended conversation is never reused.
      let conversation = opts.forceNew
        ? null
        : await this.conversationModel
            .findOne({ ...query, status: ConversationStatusEnum.IN_PROGRESS, endedAt: { $exists: false } })
            .sort({ createdAt: -1 });

      if (!conversation) {
        conversation = await this.conversationModel.create(
          createConversationDto
        );
      }

      this.eventEmitter.emit("conversation.created.visitor", {
        visitorId: query.visitor,
        conversationId: conversation._id,
      });

      if (createConversationDto.type === ConversationTypeEnum.REALTIME) {
        this.eventEmitter.emit("conversation.created.agent", {
          agentId: conversation.agent,
          conversationId: conversation._id,
        });
      }
      const activity = await this.conversationActivitiesModel.create({
        conversation: conversation._id,
        startedAt: new Date(),
        timeSpent: 0,
      });
      conversation.activities.push(activity._id);
      await conversation.save();
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @OnEvent("end.conversation", { async: true })
  async closeConversation({ conversationId }: { conversationId: string }) {
    // Emitted by the CLOSE_CHAT node.
    await this.endConversation(conversationId, undefined, "close_chat");
  }

  /**
   * `cause` rides on `conversation.ended` so listeners can tell a CLOSE_CHAT
   * from an expiry or a disconnect (crm-incident-handover R10.4).
   */
  async endConversation(
    id: string,
    status?: ConversationStatusEnum,
    cause: string = status === ConversationStatusEnum.EXPIRED ? "expired" : "ended"
  ) {
    try {
      const conversation = await this.conversationModel.findById(id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      // Ends once (R14.2, R14.5: "exactly once"). A later disconnect or
      // expiry of an already-closed conversation changes nothing.
      if ((conversation as any).endedAt) return;
      const activity = await this.conversationActivitiesModel.findOne({
        _id: conversation.activities[conversation.activities.length - 1],
      });
      const endedAt = new Date();
      if (activity) {
        activity.endedAt = endedAt;
        activity.timeSpent =
          new Date(activity.endedAt).getTime() -
          new Date(activity.startedAt).getTime();
        await activity.save();
      }
      // Conditional, so two concurrent enders (idle cron + visitor reply on
      // another instance) emit `conversation.ended` once.
      const res = await this.conversationModel.updateOne(
        { _id: conversation._id, endedAt: { $exists: false } },
        {
          $set: {
            status: status || ConversationStatusEnum.COMPLETED,
            endedAt,
            endCause: cause,
          },
          $unset: { awaitingClosure: "" },
        }
      );
      if ((res as any)?.modifiedCount === 0) return;
      this.eventEmitter.emit("conversation.ended", { conversationId: id, cause });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Persist (or clear, with `null`) the problem-question state so it survives
   * a reload (crm-incident-handover R4). Best effort: never throws into the
   * visitor flow.
   */
  async setAwaitingProblem(
    id: string,
    state: { attempt: number; askedAt: Date } | null
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) return;
      await this.conversationModel.updateOne(
        { _id: id },
        state ? { $set: { awaitingProblem: state } } : { $unset: { awaitingProblem: "" } }
      );
    } catch (error) {
      this.logger.warn(`awaitingProblem update failed: ${error?.message}`);
    }
  }

  async pushChatToConversation(id: string, chatId: string) {
    try {
      const conversation = await this.conversationModel.findByIdAndUpdate(
        id,
        { $push: { chats: chatId } },
        { new: true }
      );
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getConversationByAgentId(id: string, user?: TenantContext) {
    try {
      const botIds = await this.tenantScope.orgBotIds(user);
      const filter: Record<string, any> = { agent: id };
      if (botIds !== null) filter.bot = { $in: botIds };
      const conversations = await this.conversationModel
        .find(filter)
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });

      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getConversationByVisitorId(id: string, user?: TenantContext) {
    try {
      const botIds = await this.tenantScope.orgBotIds(user);
      const filter: Record<string, any> = { visitor: id };
      if (botIds !== null) filter.bot = { $in: botIds };
      const conversations = await this.conversationModel
        .find(filter)
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Narrows a report `$match` to the caller's bots. `null` scope (SUPER_ADMIN
   * or internal callers) leaves it unchanged. A requested bot outside the scope
   * collapses the match to nothing rather than leaking another tenant's data.
   */
  private applyBotScope(
    match: Record<string, any>,
    botIds: Types.ObjectId[] | null | undefined
  ) {
    if (botIds === undefined || botIds === null) return match;
    if (match["bot"]) {
      const requested = String(match["bot"]);
      match["bot"] = botIds.some((b) => String(b) === requested)
        ? match["bot"]
        : { $in: [] };
    } else {
      match["bot"] = { $in: botIds };
    }
    return match;
  }

  /** Resolves the caller's bot scope for report endpoints. */
  async reportScope(user?: TenantContext) {
    return this.tenantScope.orgBotIds(user);
  }

  /**
   * Full transcript for one conversation. With a `user`, the conversation's bot
   * must belong to the caller's organization (404 otherwise, so ids from another
   * tenant cannot be probed). Without a `user` it is an internal lookup.
   */
  async getConversationById(id: string, user?: TenantContext) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException("No conversation found by this Id", 404);
      }
      if (user) {
        const botIds = await this.tenantScope.orgBotIds(user);
        const row = await this.conversationModel
          .findById(id)
          .select("bot agent")
          .lean();
        const botId = row?.bot ? String((row as any).bot) : null;
        if (
          !row ||
          (botIds !== null && !botIds.some((b) => String(b) === botId))
        ) {
          throw new HttpException("No conversation found by this Id", 404);
        }
      }
      const conversation = await this.conversationModel
        .findOne({ _id: id })
        .populate("chats", {
          message: 1,
          time: 1,
          sender: 1,
          type: 1,
        })
        .populate("visitor")
        .populate("bot", "name")
        .populate("feedbacks", "rating comment")
        .populate("activities", "attributes", null, {
          sort: { startedAt: -1 },
          $limit: 1,
          $project: { activity: 1 },
        })
        .select("-__v  -updatedAt -createdAt -conversationId")
        .sort({ updatedAt: -1 });

      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getConversationByBotId(id: string, user?: TenantContext) {
    try {
      // The caller is asking for one bot's conversations; make sure that bot
      // belongs to their org (SUPER_ADMIN's orgBotIds is null => allowed).
      const botIds = await this.tenantScope.orgBotIds(user);
      if (botIds !== null && !botIds.some((b) => String(b) === String(id))) {
        return [];
      }
      const conversations = await this.conversationModel
        .find({
          bot: id,
        })
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAllConversations(
    query?: {
      status?: ConversationStatusEnum;
      type?: ConversationTypeEnum;
    },
    user?: TenantContext
  ) {
    try {
      const queryObj = {
        $match: { _id: { $ne: null } },
      };

      if (query.status === ConversationStatusEnum.BLOCKED) {
        queryObj.$match["status"] = query.status;
      } else {
        queryObj.$match["status"] = { $ne: ConversationStatusEnum.IN_PROGRESS };
      }

      if (query.type) {
        queryObj.$match["type"] = query.type;
      }

      // Tenant scope: restrict to the org's bots (null => SUPER_ADMIN).
      const botIds = await this.tenantScope.orgBotIds(user);
      if (botIds !== null) {
        queryObj.$match["bot"] = { $in: botIds };
      }

      const conversations = await this.conversationModel.aggregate([
        queryObj,
        {
          $lookup: {
            from: "visitors",
            localField: "visitor",
            foreignField: "_id",
            as: "visitor",
          },
        },
        {
          $lookup: {
            from: "bots",
            localField: "bot",
            foreignField: "_id",
            as: "bot",
          },
        },
        {
          $lookup: {
            from: "conversationactivities",
            localField: "activities",
            foreignField: "_id",
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chats",
            foreignField: "_id",
            as: "lastMessage",
            let: { chats: "$chats" },
            pipeline: [
              {
                $match: {
                  _id: { $ne: null },
                },
              },

              {
                $sort: { time: -1 },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  _id: 1,
                  message: 1,
                  time: 1,
                  type: 1,
                  sender: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$visitor",
        },
        {
          $unwind: "$bot",
        },
        {
          $unwind: {
            path: "$lastMessage",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            status: 1,
            "visitor._id": 1,
            "visitor.name": 1,
            "bot.name": 1,
            "bot.id": "$bot._id",
            lastMessage: 1,
            activity: { $arrayElemAt: ["$activities", -1] },
          },
        },
      ]);

      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async addattributes(id: string, attributes: any) {
    const conversation = await this.conversationActivitiesModel.findOne({
      conversationId: id,
    });
    if (conversation) {
      conversation.attributes = { ...conversation.attributes, ...attributes };
      await conversation.save();
    }
  }

  async getActiveConversations(user: JwtPayload) {
    try {
      const conversations = await this.conversationModel.aggregate([
        {
          $match: {
            status: ConversationStatusEnum.IN_PROGRESS,
            type: ConversationTypeEnum.REALTIME,
            agent: new ObjectId(user._id),
          },
        },
        {
          $lookup: {
            from: "visitors",
            localField: "visitor",
            foreignField: "_id",
            as: "visitor",
          },
        },
        {
          $lookup: {
            from: "bots",
            localField: "bot",
            foreignField: "_id",
            as: "bot",
          },
        },
        {
          $lookup: {
            from: "conversationactivities",
            localField: "activities",
            foreignField: "_id",
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chats",
            foreignField: "_id",
            as: "chats",
            let: { chats: "$chats" },
            pipeline: [
              {
                $match: {
                  _id: { $ne: null },
                },
              },

              {
                $sort: { time: -1 },
              },
              {
                $limit: 40,
              },
              {
                $sort: { time: 1 },
              },
            ],
          },
        },

        {
          $addFields: {
            lastMessage: {
              $arrayElemAt: ["$chats", -1],
            },
          },
        },

        {
          $unwind: "$visitor",
        },
        {
          $unwind: "$bot",
        },
        {
          $unwind: {
            path: "$lastMessage",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $project: {
            chats: 1,
            _id: 1,
            type: 1,
            status: 1,
            "visitor._id": 1,
            "visitor.name": 1,
            "bot.name": 1,
            "bot.id": "$bot._id",
            lastMessage: 1,
            activity: { $arrayElemAt: ["$activities", -1] },
          },
        },
      ]);
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateConversationFeedback(id: string, feedback: any) {
    try {
      const conversation = await this.conversationModel.findById(id);
      if (conversation) {
        conversation.feedbacks.push(feedback);
        await conversation.save();
      }
    } catch (error) {
      this.logger.error(`Error while updating conversation feedback ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async transferConversationToAgent(conversationId: string, agentId: string) {
    try {
      const conversation = await this.conversationModel.findById(
        conversationId
      );
      if (conversation) {
        conversation.agent = agentId;
        conversation.type = ConversationTypeEnum.REALTIME;
        conversation.transferredToAgent = true;
        conversation.transferredAt = new Date();
        await conversation.save();
      }
    } catch (error) {
      this.logger.error(`Error while updating conversation feedback ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async markConversationExpiredAfter2Hours() {
    const filter = {
      status: ConversationStatusEnum.IN_PROGRESS,
      createdAt: {
        $lte: new Date(new Date().setHours(new Date().getHours() - 2)),
      },
    };
    // Collect the ids first: updateMany returns none, and an expired
    // conversation must clear its open agent alert (resolution `ended`).
    const expiring = await this.conversationModel
      .find(filter)
      .select("_id")
      .lean();
    await this.conversationModel.updateMany(filter, {
      status: ConversationStatusEnum.EXPIRED,
    });
    for (const c of expiring) {
      this.eventEmitter.emit("conversation.ended", {
        conversationId: String((c as any)._id),
        cause: "expired",
      });
    }
  }

  async getTotalCount(
    days = 30,
    handledByAgent?: boolean,
    title?: string,
    status?: ConversationStatusEnum,
    all?: boolean,
    isHistorical?: boolean,
    botIds?: Types.ObjectId[] | null
  ) {
    const query = {};

    if (!handledByAgent) {
      query["transferredToAgent"] = { $ne: true };
    } else query["transferredToAgent"] = { $eq: true };

    if (status) {
      query["status"] = status;
    }
    if (all) {
      delete query["transferredToAgent"];
    }
    if (isHistorical) {
      query["status"] = { $ne: ConversationStatusEnum.IN_PROGRESS };
    }
    // Tenant scope: conversations carry no organizationId, so pin them to the
    // caller's bots. `null` means SUPER_ADMIN (no restriction); `[]` means an
    // org with no bots, which correctly matches nothing.
    if (botIds !== undefined && botIds !== null) {
      query["bot"] = { $in: botIds };
    }

    const total = await this.conversationModel.countDocuments(query);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.conversationModel.countDocuments({
        ...query,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: title || "Total Conversations",
      subtitle: getDaySubtitle(days),
      type: "conversation",
    };
  }

  async getDayWisePerformance(
    params: ReportParamsDto,
    agent = false,
    botScope?: Types.ObjectId[] | null
  ) {
    const { id: botId, startDate, agentId } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = Types.ObjectId.isValid(botId)
        ? new ObjectId(botId)
        : { $in: [] };
    }

    if (agentId) {
      match["agent"] = Types.ObjectId.isValid(agentId)
        ? new ObjectId(agentId)
        : { $in: [] };
    }

    if (agent) {
      match["transferredToAgent"] = true;
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: this.applyBotScope(match, botScope),
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.COMPLETED] },
                  then: 1,
                  else: 0,
                },
              },
            },
            expired: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.EXPIRED] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "MON" },
                  { case: { $eq: ["$_id", 2] }, then: "TUE" },
                  { case: { $eq: ["$_id", 3] }, then: "WED" },
                  { case: { $eq: ["$_id", 4] }, then: "THU" },
                  { case: { $eq: ["$_id", 5] }, then: "FRI" },
                  { case: { $eq: ["$_id", 6] }, then: "SAT" },
                  { case: { $eq: ["$_id", 7] }, then: "SUN" },
                ],
              },
            },
            total: 1,
            completed: 1,
            expired: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDateWiseConversations(
    params: ReportParamsDto,
    agent = false,
    botScope?: Types.ObjectId[] | null
  ) {
    const { id: botId, startDate, agentId } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = Types.ObjectId.isValid(botId)
        ? new ObjectId(botId)
        : { $in: [] };
    }

    if (agentId) {
      match["agent"] = Types.ObjectId.isValid(agentId)
        ? new ObjectId(agentId)
        : { $in: [] };
    }

    if (agent) {
      match["transferredToAgent"] = true;
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: this.applyBotScope(match, botScope),
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.COMPLETED] },
                  then: 1,
                  else: 0,
                },
              },
            },
            expired: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.EXPIRED] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: "$_id",
            total: 1,
            completed: 1,
            expired: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(`Error while getting date wise conversations ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async TotalCountPlatform(botScope?: Types.ObjectId[] | null) {
    try {
      const result = await this.conversationModel.aggregate([
        { $match: this.applyBotScope({}, botScope) },
        {
          $facet: {
            total: [
              {
                $count: "total",
              },
            ],
            facebook: [
              {
                $match: {
                  platform: PlatformEnum.FACEBOOK,
                },
              },
              {
                $count: "facebook",
              },
            ],
            whatsapp: [
              {
                $match: {
                  platform: PlatformEnum.WHATSAPP,
                },
              },
              {
                $count: "whatsapp",
              },
            ],
            telegram: [
              {
                $match: {
                  platform: PlatformEnum.TELEGRAM,
                },
              },
              {
                $count: "telegram",
              },
            ],

            widget: [
              {
                $match: {
                  platform: PlatformEnum.WIDGET,
                },
              },
              {
                $count: "widget",
              },
            ],
          },
        },
        {
          $project: {
            facebook: {
              $arrayElemAt: ["$facebook.facebook", 0],
            },

            whatsapp: {
              $arrayElemAt: ["$whatsapp.whatsapp", 0],
            },
            telegram: {
              $arrayElemAt: ["$telegram.telegram", 0],
            },
            widget: {
              $arrayElemAt: ["$widget.widget", 0],
            },
          },
        },
      ]);

      return result[0];
    } catch (err) {
      this.logger.error(`Error in getting platform data count: ${err.message}`);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async DayWisePlatform(
    params: ReportParamsDto,
    botScope?: Types.ObjectId[] | null
  ) {
    const { id: botId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = Types.ObjectId.isValid(botId)
        ? new ObjectId(botId)
        : { $in: [] };
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: this.applyBotScope(match, botScope),
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            facebook: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.FACEBOOK] },
                  then: 1,
                  else: 0,
                },
              },
            },
            whatsapp: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WHATSAPP] },
                  then: 1,
                  else: 0,
                },
              },
            },

            telegram: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.TELEGRAM] },
                  then: 1,
                  else: 0,
                },
              },
            },

            widget: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WIDGET] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "MON" },
                  { case: { $eq: ["$_id", 2] }, then: "TUE" },
                  { case: { $eq: ["$_id", 3] }, then: "WED" },
                  { case: { $eq: ["$_id", 4] }, then: "THU" },
                  { case: { $eq: ["$_id", 5] }, then: "FRI" },
                  { case: { $eq: ["$_id", 6] }, then: "SAT" },
                  { case: { $eq: ["$_id", 7] }, then: "SUN" },
                ],
              },
            },
            total: 1,
            facebook: 1,
            whatsapp: 1,
            telegram: 1,
            widget: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async DateWisePlatform(
    params: ReportParamsDto,
    botScope?: Types.ObjectId[] | null
  ) {
    const { id: botId, startDate } = params;
    let endDate = params.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = Types.ObjectId.isValid(botId)
        ? new ObjectId(botId)
        : { $in: [] };
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: this.applyBotScope(match, botScope),
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: 1 },
            facebook: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.FACEBOOK] },
                  then: 1,
                  else: 0,
                },
              },
            },
            whatsapp: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WHATSAPP] },
                  then: 1,
                  else: 0,
                },
              },
            },

            telegram: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.TELEGRAM] },
                  then: 1,
                  else: 0,
                },
              },
            },

            widget: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WIDGET] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: "$_id",
            total: 1,
            facebook: 1,
            whatsapp: 1,
            telegram: 1,
            widget: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(`Error while getting date wise conversations ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getActiveCount(
    query: { agentId?: string; anonymous?: boolean },
    title?: string,
    botIds?: Types.ObjectId[] | null
  ) {
    const { agentId, anonymous } = query;
    const match = {
      status: ConversationStatusEnum.IN_PROGRESS,
    };
    if (agentId) {
      match["agent"] = agentId;
      match["type"] = ConversationTypeEnum.REALTIME;
    }
    if (anonymous) {
      match["anonymous"] = true;
    }
    // Tenant scope: pin to the caller's bots (null => SUPER_ADMIN, no limit).
    if (botIds !== undefined && botIds !== null) {
      match["bot"] = { $in: botIds };
    }
    const total = await this.conversationModel.countDocuments(match);
    return {
      stats: total,
      trendNumber: 0,
      trend: "positive",
      title: title || "Total Active",
      subtitle: getDaySubtitle(1),
      type: "conversation",
    };
  }

  async getActiveStats(user: JwtPayload) {
    // "Total Active" spans the whole org, so scope it to the caller's bots.
    // The "My *" tiles are already narrowed by agentId, but we still scope them
    // so an agent can never see counts drawn from another tenant's bots.
    const botIds = await this.tenantScope.orgBotIds(user as TenantContext);
    return Promise.all([
      this.getActiveCount({}, "Total Active", botIds),
      this.getActiveCount({ agentId: user._id }, "My Active", botIds),
      this.getActiveCount(
        { agentId: user._id, anonymous: true },
        "My Anonymous",
        botIds
      ),
      this.getActiveCount(
        { agentId: user._id, anonymous: false },
        "My Named",
        botIds
      ),
    ]);
  }

  async getHistoryStats(user?: TenantContext) {
    const botIds = await this.tenantScope.orgBotIds(user);
    return Promise.all([
      this.getTotalCount(
        30,
        false,
        "Total Conversations",
        ConversationStatusEnum.COMPLETED,
        true,
        true,
        botIds
      ),
      this.getTotalCount(
        30,
        false,
        "Handled By Bot",
        ConversationStatusEnum.COMPLETED,
        false,
        true,
        botIds
      ),
      this.getTotalCount(
        30,
        true,
        "Handled By Agent",
        ConversationStatusEnum.COMPLETED,
        false,
        true,
        botIds
      ),
    ]);
  }

  async getBlockStats(user?: TenantContext) {
    const botIds = await this.tenantScope.orgBotIds(user);
    return Promise.all([
      this.getTotalCount(
        30,
        false,
        "Blocked By Bot",
        ConversationStatusEnum.BLOCKED,
        undefined,
        undefined,
        botIds
      ),
      this.getTotalCount(
        30,
        true,
        "Blocked By Agent",
        ConversationStatusEnum.BLOCKED,
        undefined,
        undefined,
        botIds
      ),
      this.getTotalCount(
        30,
        false,
        "Total Blocked Conversations",
        ConversationStatusEnum.COMPLETED,
        true,
        undefined,
        botIds
      ),
    ]);
  }

  @OnEvent("end-conversation-by-agent", { async: true })
  async endConversationByAgent(data: { conversationId: string }) {
    const { conversationId } = data;
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.type = ConversationTypeEnum.BOT;
      conversation.agentCallEndedAt = new Date();
      await conversation.save();
    }
    // The agent ended the handover: close the request so a later one alerts anew.
    // The chat goes back to the bot, so an open incident stays open (R10.2).
    this.eventEmitter.emit("conversation.ended", { conversationId, cause: "agent_release" });
  }

  @OnEvent("report-conversation", { async: true })
  async reportConversation(data: { conversationId: string }) {
    const { conversationId } = data;
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.status = ConversationStatusEnum.BLOCKED;
      await conversation.save();
    }
  }

  async getChats(conversationId: string, visitorId: string) {
    try {
      const conversation = await this.conversationModel
        .findById(conversationId)
        .populate("bot", "name")
        .populate("agent", "name")
        .populate("chats");

      if (!conversation) {
        throw new HttpException("No conversation found by this Id", 404);
      }

      const botId = conversation.bot._id.toHexString();

      // label : You, AgentName, BotName
      const data = conversation.chats.map((chat) => {
        return {
          message: chat.message,
          label:
            chat.sender === visitorId
              ? "You"
              : chat.sender === botId
              ? conversation.bot.name
              : conversation.agent.name,
        };
      });

      return data;
    } catch (err) {
      this.logger.error("error in getting chat", err);
    }
  }
  async homeConversationCount(
    filter: any,
    status?: ConversationStatusEnum,
    user?: TenantContext
  ) {
    if (!filter) filter = "day";
    // moment().startOf() accepts only unit names; anything else is rejected
    // rather than silently producing an invalid date.
    if (!["day", "week", "month", "year"].includes(filter)) filter = "day";
    const scope = this.applyBotScope(
      {},
      user ? await this.tenantScope.orgBotIds(user) : undefined
    );
    try {
      const total = await this.conversationModel.countDocuments({
        ...scope,
        createdAt: {
          $gte: new Date(moment().startOf(filter).toISOString()),
        },
        status: status || { $ne: "" },
      });

      let percentageChange = 0;
      const previousTotal = await this.conversationModel.countDocuments({
        ...scope,
        createdAt: {
          $gte: new Date(
            moment().subtract(1, filter).startOf(filter).toISOString()
          ),
        },
        status: status || { $ne: "" },
      });

      if (previousTotal) {
        percentageChange = Math.round(
          ((total - previousTotal) / previousTotal) * 100
        );
      }

      return {
        stats: total,
        trendNumber: Math.abs(percentageChange),
        trend: percentageChange > 0 ? "positive" : "negative",
        title:
          status === ConversationStatusEnum.BLOCKED
            ? "Blocked Conversations"
            : "Total Conversations",
        type: "conversation",
      };
    } catch (error) {
      this.logger.error(`Error while getting home conversation count ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
