import { Inject, Injectable, Logger } from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
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
 * Inbox list query. `botIds` is the caller's permission scope (see
 * InboxService.scopeFilter) and is applied as a `bot: { $in }` filter — it is
 * NOT optional-by-accident: `undefined` means "unscoped/admin", an empty array
 * means "this caller can see nothing" and must return nothing rather than
 * everything.
 */
export interface ThreadOwner {
  id: string;
  /** Display name, or the email when the agent has no name (R8.1). */
  name: string;
}

export type ClaimResult =
  | { ok: true; changed: boolean }
  | { ok: false; owner: ThreadOwner | null };

export interface ListThreadsOptions {
  channel?: string;
  botIds?: string[] | null;
  search?: string;
  limit?: number;
  /** Cursor: return threads whose lastMessageAt is strictly older than this. */
  before?: Date;
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

  /**
   * Create-or-label a thread from the channel's own chat list, with no message.
   *
   * Distinct from {@link upsertForInbound} in three ways that matter:
   *
   *  - It reports whether the row was **created**, so the caller can announce a
   *    changed channel list only when the tabs could actually have changed.
   *  - It never touches `unreadCount`. WhatsApp's own unread count answers "how
   *    many has the phone not seen", which is a different question from "how many
   *    has this dashboard not seen" — adopting it would show unread badges for
   *    messages an agent already read here.
   *  - `lastMessageAt` is only ever moved **forward**, and only on insert or when
   *    the channel reports something newer. A chat-list event replaying an older
   *    timestamp must not drag an active thread down the inbox.
   *
   * `lastMessage` is deliberately left unset: the preview must describe a message
   * we have actually stored, or the inbox would show a row whose thread is empty.
   */
  async upsertForChatSync(input: {
    channel: string;
    sessionName?: string;
    chatId: string;
    phone?: string;
    pushName?: string;
    bot?: string;
    lastMessageAt?: Date;
    meta?: Record<string, any>;
  }): Promise<{ thread: ChannelThreadDocument; created: boolean }> {
    const key = this.normalizeKey(input);

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
    // On insert this is the only activity clock we have; on update it is handled
    // by the forward-only $max below, so it must not appear in both.
    if (input.lastMessageAt) setOnInsert.lastMessageAt = input.lastMessageAt;

    const update: Record<string, any> = { $setOnInsert: setOnInsert };
    if (Object.keys(set).length) update.$set = set;

    const before = await this.threadModel.findOne(key, { _id: 1 });

    // `$max` rather than `$set`: chat-list events arrive out of order and on every
    // reconnect, and an older timestamp winning would reshuffle the inbox.
    if (input.lastMessageAt && before) {
      update.$max = { lastMessageAt: input.lastMessageAt };
      delete setOnInsert.lastMessageAt;
    }

    const thread = await this.threadModel.findOneAndUpdate(key, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return { thread, created: !before };
  }

  async findByKey(key: ChannelThreadKey): Promise<ChannelThreadDocument | null> {
    return this.threadModel.findOne(this.normalizeKey(key));
  }

  /**
   * Cache a contact's profile picture.
   *
   * `avatarUpdatedAt` is stamped even for a null url. A contact with no picture and
   * a contact whose lookup failed look identical from here, and without recording
   * the attempt both would be re-fetched on every single sync — a per-contact round
   * trip to the channel, forever, for an answer that will not change.
   */
  async setContactAvatar(
    threadId: string,
    avatarUrl: string | null,
  ): Promise<void> {
    await this.threadModel.updateOne(
      { _id: threadId },
      avatarUrl
        ? { $set: { avatarUrl, avatarUpdatedAt: new Date() } }
        : // Clear a stale url rather than leaving one that no longer resolves: a
          // broken image is worse than an initials placeholder.
          {
            $set: { avatarUpdatedAt: new Date() },
            $unset: { avatarUrl: '' },
          },
    );
  }

  /**
   * Threads on one channel account whose avatar is missing or past its shelf life.
   *
   * Ordered by most recent activity and hard-limited, because this drives outbound
   * lookups against the channel: the threads an agent is about to look at are worth
   * the round trip, and a long-dead conversation is not. Deliberately excludes
   * threads with no `phone` — an `@lid`-only contact cannot be resolved to a
   * picture, so asking would spend a request to be told nothing.
   */
  async findThreadsNeedingAvatar(options: {
    channel: string;
    sessionName?: string;
    staleBefore: Date;
    limit: number;
  }): Promise<ChannelThreadDocument[]> {
    return this.threadModel
      .find({
        channel: options.channel,
        sessionName: options.sessionName || '',
        $or: [
          { avatarUpdatedAt: { $exists: false } },
          { avatarUpdatedAt: { $lt: options.staleBefore } },
        ],
      })
      .sort({ lastMessageAt: -1 })
      .limit(options.limit)
      .select({ _id: 1, chatId: 1, avatarUrl: 1, avatarUpdatedAt: 1 });
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

  /**
   * Single-owner takeover (crm-incident-handover R7.1, Property 5): one
   * conditional write that succeeds only when nobody owns the thread or the
   * caller already does. Concurrent claims serialise on the document, so
   * exactly one wins. `changed` is false for a re-claim by the owner (no-op,
   * no event, R7.5).
   */
  async claim(threadId: string, userId: string): Promise<ClaimResult> {
    const me = String(userId);
    const before: any = await this.threadModel
      .findOneAndUpdate(
        {
          _id: threadId,
          $or: [{ assignedAgent: null }, { assignedAgent: { $exists: false } }, { assignedAgent: me }],
        },
        { $set: { handledByAgent: true, assignedAgent: me, botEnabled: false } },
        // The pre-image tells a fresh claim from a re-claim.
        { new: false },
      )
      .select('assignedAgent handledByAgent')
      .lean();
    if (before) {
      const wasMine = before.assignedAgent && String(before.assignedAgent) === me && before.handledByAgent === true;
      return { ok: true, changed: !wasMine };
    }
    return { ok: false, owner: await this.ownerOf(threadId) };
  }

  /** Owner-only release (R7.6). `changed` false when the caller is not the owner. */
  async releaseIfOwner(threadId: string, userId: string): Promise<ClaimResult> {
    const res: any = await this.threadModel
      .findOneAndUpdate(
        { _id: threadId, assignedAgent: String(userId) },
        { $set: { handledByAgent: false, botEnabled: true }, $unset: { assignedAgent: '' } },
        { new: false },
      )
      .select('_id')
      .lean();
    if (res) return { ok: true, changed: true };
    const owner = await this.ownerOf(threadId);
    // Nobody owns it: releasing is a no-op, not a conflict.
    if (!owner) return { ok: true, changed: false };
    return { ok: false, owner };
  }

  /**
   * Admin override (R7.3): move ownership from the current owner to `toId`,
   * conditional on the owner not having changed since the admin looked.
   */
  async overrideOwner(threadId: string, expectedOwnerId: string | null, toId: string): Promise<ClaimResult> {
    const filter: any = { _id: threadId };
    if (expectedOwnerId) filter.assignedAgent = String(expectedOwnerId);
    else filter.$or = [{ assignedAgent: null }, { assignedAgent: { $exists: false } }];
    const res: any = await this.threadModel
      .findOneAndUpdate(
        filter,
        { $set: { handledByAgent: true, assignedAgent: String(toId), botEnabled: false } },
        { new: false },
      )
      .select('_id')
      .lean();
    if (res) return { ok: true, changed: String(expectedOwnerId ?? '') !== String(toId) };
    return { ok: false, owner: await this.ownerOf(threadId) };
  }

  /** The current owner's id and display name (email when nameless, R8.1). */
  async ownerOf(threadId: string): Promise<ThreadOwner | null> {
    const t: any = await this.threadModel
      .findById(threadId)
      .select('assignedAgent')
      .populate('assignedAgent', 'name email')
      .lean();
    const a = t?.assignedAgent;
    if (!a) return null;
    const id = a._id ? String(a._id) : String(a);
    return { id, name: (a.name || '').trim() || a.email || 'another agent' };
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
   *
   * `botIds` scopes the counts to the channels the caller may see. Passing an
   * empty array yields no channels; passing null/undefined is unscoped.
   */
  async listChannelsWithCounts(
    botIds?: string[] | null,
  ): Promise<
    Array<{ channel: string; threads: number; unread: number }>
  > {
    const pipeline: any[] = [];
    const scope = this.botScopeFilter(botIds);
    if (scope) pipeline.push({ $match: scope });
    pipeline.push(
      {
        $group: {
          _id: '$channel',
          threads: { $sum: 1 },
          // Threads carrying at least one unseen message — the tab badge is a
          // count of conversations needing attention, not of messages.
          unread: {
            $sum: {
              $cond: [{ $gt: ['$unreadCount', 0] }, 1, 0],
            },
          },
        },
      },
      { $sort: { threads: -1 } },
    );

    const rows = await this.threadModel.aggregate(pipeline);
    return rows.map((r) => ({
      channel: r._id,
      threads: r.threads,
      unread: r.unread,
    }));
  }

  /**
   * Translate a permission scope into a Mongo filter fragment.
   *
   * Returns `null` for an unscoped (admin) caller so the caller can omit the
   * `$match` entirely. An EMPTY array deliberately produces `{ bot: {$in: []} }`
   * — a filter that matches nothing — because "this agent is assigned no bots"
   * must show an empty inbox, not the whole tenant's.
   */
  private botScopeFilter(
    botIds?: string[] | null,
  ): Record<string, any> | null {
    if (botIds === undefined || botIds === null) return null;
    return {
      bot: {
        $in: botIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }

  /**
   * The inbox thread list for one channel tab, newest activity first.
   *
   * Cursor-paginated on `lastMessageAt` rather than offset-paginated: threads
   * reorder constantly as messages arrive, and an offset would skip or repeat
   * rows between pages. Backed by the `(channel, lastMessageAt)` index.
   */
  async listThreads(options: ListThreadsOptions = {}): Promise<{
    threads: ChannelThreadDocument[];
    nextCursor: string | null;
  }> {
    const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);

    const filter: Record<string, any> = {};
    if (options.channel) filter.channel = options.channel;

    const scope = this.botScopeFilter(options.botIds);
    if (scope) Object.assign(filter, scope);

    if (options.search) {
      // Escaped: a contact search for "+91 (22)" must not be parsed as a regex
      // group, and an unescaped user string is a ReDoS vector.
      const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');
      filter.$or = [{ pushName: rx }, { phone: rx }, { chatId: rx }];
    }

    if (options.before) {
      filter.lastMessageAt = { $lt: options.before };
    }

    // limit+1 to learn whether another page exists without a second count query.
    const rows = await this.threadModel
      .find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(limit + 1)
      .populate('bot', 'name')
      .populate('visitor', 'name email phone')
      .populate('assignedAgent', 'name email');

    const hasMore = rows.length > limit;
    const threads = hasMore ? rows.slice(0, limit) : rows;
    // A thread that has never carried a message has no lastMessageAt and cannot
    // be a cursor; nulling out ends pagination rather than looping on it.
    const last = threads[threads.length - 1];
    const nextCursor =
      hasMore && last?.lastMessageAt
        ? last.lastMessageAt.toISOString()
        : null;

    return { threads, nextCursor };
  }

  /**
   * Threads showing this visitor or conversation, populated for the inbox
   * list (crm-plugins-service-desk R4.4: republished when the name changes).
   * Social threads span conversations, so the visitor is matched too.
   */
  async findForVisitorOrConversation(
    visitorId: string,
    conversationId: string,
  ): Promise<ChannelThreadDocument[]> {
    const or: any[] = [];
    if (Types.ObjectId.isValid(visitorId)) or.push({ visitor: visitorId });
    if (Types.ObjectId.isValid(conversationId)) or.push({ conversation: conversationId });
    if (!or.length) return [];
    return this.threadModel
      .find({ $or: or })
      .limit(10)
      .populate('bot', 'name')
      .populate('visitor', 'name email phone')
      .populate('assignedAgent', 'name email');
  }

  /** One thread with its relations, for the inbox detail header. */
  async findByIdPopulated(
    id: string,
  ): Promise<ChannelThreadDocument | null> {
    return this.threadModel
      .findById(id)
      .populate('bot', 'name')
      .populate('visitor', 'name email phone')
      .populate('assignedAgent', 'name email');
  }
}
