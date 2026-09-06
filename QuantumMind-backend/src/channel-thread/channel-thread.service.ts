import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { CHANNEL_THREAD_PROVIDER } from './constant';
import { ChannelThreadDocument } from './entities/channel-thread.entity';

/** The identity that uniquely locates a thread. */
export interface ChannelThreadKey {
  channel: string;
  sessionName?: string;
  chatId: string;
}

export interface UpsertThreadInput extends ChannelThreadKey {
  phone?: string;
  pushName?: string;
  bot?: string;
  meta?: Record<string, any>;
}

/** Everything the outbound path needs to deliver a reply, read from the DB. */
export interface ReplyTarget {
  threadId: string;
  channel: string;
  sessionName: string;
  chatId: string;
  phone?: string;
}

export interface ThreadPreview {
  message: string;
  type: string;
  time: Date;
  direction?: string;
  sender?: string;
}

/**
 * Owns ChannelThread records: the durable identity + reply address for a
 * conversation with one external contact on one channel.
 *
 * Channel-agnostic by design — the WhatsApp Web hub is its first caller, and
 * Telegram/Facebook/Instagram reuse it unchanged by passing a different
 * `channel` string.
 */
@Injectable()
export class ChannelThreadService {
  private readonly logger = new Logger(ChannelThreadService.name);

  constructor(
    @Inject(CHANNEL_THREAD_PROVIDER)
    private readonly threadModel: Model<ChannelThreadDocument>,
  ) {}

  /** Normalised so a missing sessionName never breaks the compound unique index. */
  private normalizeKey(key: ChannelThreadKey) {
    return {
      channel: key.channel,
      sessionName: key.sessionName || '',
      chatId: key.chatId,
    };
  }

  /**
   * Find-or-create the thread for an inbound message, refreshing the contact
   * details the channel just told us.
   *
   * Uses a single atomic upsert rather than find-then-create: two messages
   * arriving in the same tick would both miss the read and then race on insert,
   * and one would die on the unique index. `$setOnInsert` keeps the create-only
   * fields (bot, botEnabled) from being rewritten on every later message —
   * notably `botEnabled`, which an agent may have turned off.
   */
  async upsertForInbound(input: UpsertThreadInput): Promise<ChannelThreadDocument> {
    const key = this.normalizeKey(input);

    // Only overwrite contact details we actually received; a later message with
    // no pushName must not blank the name we learned earlier.
    const set: Record<string, any> = {};
    if (input.phone) set.phone = input.phone;
    if (input.pushName) set.pushName = input.pushName;
    if (input.meta && Object.keys(input.meta).length) {
      for (const [k, v] of Object.entries(input.meta)) {
        set[`meta.${k}`] = v;
      }
    }

    const setOnInsert: Record<string, any> = {
      botEnabled: true,
      handledByAgent: false,
      unreadCount: 0,
    };
    if (input.bot) setOnInsert.bot = input.bot;

    return this.threadModel.findOneAndUpdate(
      key,
      {
        $set: set,
        $setOnInsert: setOnInsert,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  async findByKey(key: ChannelThreadKey): Promise<ChannelThreadDocument | null> {
    return this.threadModel.findOne(this.normalizeKey(key));
  }

  async findById(id: string): Promise<ChannelThreadDocument | null> {
    return this.threadModel.findById(id);
  }

  /**
   * Resolve a reply address from the visitor id.
   *
   * This is the method that makes replies survive a restart: the caller no
   * longer needs the in-memory `ctx`. When a visitor somehow has several threads
   * (e.g. reachable on both WhatsApp and Telegram) the most recently active one
   * wins, which is where the reply belongs.
   */
  async getReplyTargetByVisitor(visitorId: string): Promise<ReplyTarget | null> {
    const thread = await this.threadModel
      .findOne({ visitor: visitorId })
      .sort({ lastMessageAt: -1 });
    return thread ? this.toReplyTarget(thread) : null;
  }

  async getReplyTargetByThread(threadId: string): Promise<ReplyTarget | null> {
    const thread = await this.threadModel.findById(threadId);
    return thread ? this.toReplyTarget(thread) : null;
  }

  private toReplyTarget(thread: ChannelThreadDocument): ReplyTarget {
    return {
      threadId: (thread._id as any).toString(),
      channel: thread.channel,
      sessionName: thread.sessionName,
      chatId: thread.chatId,
      phone: thread.phone,
    };
  }

  /** Bind the visitor + current conversation once the chat initializer has them. */
  async attachConversation(
    threadId: string,
    data: { visitor?: string; conversation?: string; bot?: string },
  ): Promise<void> {
    const set: Record<string, any> = {};
    if (data.visitor) set.visitor = data.visitor;
    if (data.conversation) set.conversation = data.conversation;
    if (data.bot) set.bot = data.bot;
    if (!Object.keys(set).length) return;
    await this.threadModel.updateOne({ _id: threadId }, { $set: set });
  }

  /**
   * Refresh the inbox preview after a message lands.
   *
   * `incrementUnread` is only true for inbound messages the agent has not seen;
   * our own outbound messages must never raise the customer's unread badge.
   */
  async touchLastMessage(
    threadId: string,
    preview: ThreadPreview,
    incrementUnread = false,
  ): Promise<void> {
    const update: Record<string, any> = {
      $set: {
        lastMessage: preview,
        lastMessageAt: preview.time || new Date(),
      },
    };
    if (incrementUnread) {
      update.$inc = { unreadCount: 1 };
    }
    await this.threadModel.updateOne({ _id: threadId }, update);
  }

  /**
   * Record how far back our local history reaches — the cursor on-demand history
   * pages from.
   *
   * `$min` on the timestamp is deliberate: history pages and live messages
   * arrive interleaved, and the oldest boundary must only ever move backwards.
   * The id is written alongside only when it actually moved the boundary, which
   * is why this is a read-compare-write rather than a blind `$set`.
   */
  async extendOldestBoundary(
    threadId: string,
    oldestAt: Date,
    oldestExternalMessageId?: string,
  ): Promise<void> {
    if (!oldestAt) return;
    const thread = await this.threadModel.findById(threadId, {
      oldestMessageAt: 1,
    });
    if (!thread) return;
    if (thread.oldestMessageAt && thread.oldestMessageAt <= oldestAt) return;
    await this.threadModel.updateOne(
      { _id: threadId },
      {
        $set: {
          oldestMessageAt: oldestAt,
          ...(oldestExternalMessageId ? { oldestExternalMessageId } : {}),
        },
      },
    );
  }

  async markHistoryRequested(threadId: string): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      { $set: { historyRequestedAt: new Date() } },
    );
  }

  async markHistoryExhausted(threadId: string): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      { $set: { historyExhausted: true } },
    );
  }

  async markRead(threadId: string): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      { $set: { unreadCount: 0 } },
    );
  }

  /** Agent takes the thread over: the bot stops answering until released. */
  async assignToAgent(threadId: string, agentId: string): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      {
        $set: {
          handledByAgent: true,
          assignedAgent: agentId,
          botEnabled: false,
        },
      },
    );
  }

  /** Hand the thread back to the bot. */
  async releaseToBot(threadId: string): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      {
        $set: { handledByAgent: false, botEnabled: true },
        $unset: { assignedAgent: '' },
      },
    );
  }

  async setBotEnabled(threadId: string, enabled: boolean): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      { $set: { botEnabled: enabled } },
    );
  }

  /**
   * Distinct channels that actually have threads — this is what drives the
   * dashboard's channel tabs, so a new platform appears automatically without a
   * frontend change.
   */
  async listChannelsWithCounts(): Promise<
    Array<{ channel: string; threads: number; unread: number }>
  > {
    const rows = await this.threadModel.aggregate([
      {
        $group: {
          _id: '$channel',
          threads: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $gt: ['$unreadCount', 0] }, 1, 0],
            },
          },
        },
      },
      { $sort: { threads: -1 } },
    ]);
    return rows.map((r) => ({
      channel: r._id,
      threads: r.threads,
      unread: r.unread,
    }));
  }
}
