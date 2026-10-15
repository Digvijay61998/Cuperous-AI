import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { createHmac, timingSafeEqual } from "crypto";
import { SocialService } from "src/social/social.service";
import { SocialPlatformEnum } from "src/social/enums/social-platform.enum";
import { ChatInitializerService } from "src/chat-initializer/chat-initializer.service";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { SocketStateService } from "src/socket/socket-state.service";
import { ConversationService } from "src/conversation/conversation.service";
import { ChannelThreadService } from "src/channel-thread/channel-thread.service";
import { InboxEventsService } from "src/inbox/inbox-events.service";
import { toMessageView, toThreadView } from "src/inbox/inbox.mapper";
import {
  INBOX_CHANNEL_STATUS_EVENT,
  INBOX_MARK_READ_EVENT,
  INBOX_SEND_MESSAGE_EVENT,
  InboxChannelStatusQuery,
  InboxChannelStatusResult,
  InboxMarkReadEvent,
  InboxSendMessageEvent,
  InboxSendResult,
} from "src/inbox/inbox.constants";
import { ChatDirectionEnum } from "src/conversation/enums/chat-direction.enum";
import { ChatStatusEnum } from "src/conversation/enums/chat-status.enum";
import { ChatTypeEnum } from "src/conversation/enums/chat-type.enum";
import { ConversationStatusEnum } from "src/conversation/enums/conversation-status.enum";
import { UploadService } from "src/upload/upload.service";
import {
  CloudInboundMessage,
  CloudStatusEvent,
  parseCloudWebhook,
} from "./whatsapp-cloud-webhook.parser";
import {
  AUTH_ERROR_CODES,
  CloudCredentials,
  RATE_LIMIT_ERROR_CODES,
  SERVICE_WINDOW_ERROR_CODES,
  WhatsappCloudApiError,
  WhatsappCloudClient,
} from "./whatsapp-cloud.client";

/** Inbox channel key for the Meta WhatsApp Cloud API. */
export const WA_CLOUD_CHANNEL = PlatformEnum.WHATSAPP;
/** Bot/agent outbound intent emitted by RedisPropagatorService. */
export const WA_CLOUD_SEND_EVENT = "send-whatsapp-message";

/** WhatsApp only allows free-form messages within 24h of the customer's last one. */
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const ACCOUNT_CACHE_TTL_MS = 60_000;

interface CloudAccount {
  accountId: string;
  accessToken: string;
  phoneNumberId?: string;
  jarcubeBotId: string;
}

interface SendTarget {
  accountId: string;
  phoneNumberId?: string;
  recipient: string;
  threadId?: string;
}

/**
 * WhatsApp Cloud API (Meta official) channel hub.
 *
 * Mirrors WhatsappWebInboundService so both WhatsApp channels behave the same
 * in the omnichannel inbox: every message lands on a durable ChannelThread
 * (which is what creates the inbox tab and gives agents history, takeover,
 * tickets and replies), the bot or the owning agent gets it, and replies work
 * after a restart because the reply address and credentials come from the
 * database, not from in-memory socket state.
 *
 * Ordering rule, as for WhatsApp Web: persist, then publish, exactly once.
 * Meta retries webhooks, and the (thread, externalMessageId) unique index is the
 * dedup oracle that stops a retried delivery from being answered twice.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly accountCache = new Map<
    string,
    { value: CloudAccount | null; expiresAt: number }
  >();
  private readonly inboundChains = new Map<string, Promise<void>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly socialService: SocialService,
    private readonly chatInitializerService: ChatInitializerService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly socketStateService: SocketStateService,
    private readonly conversationService: ConversationService,
    private readonly channelThreadService: ChannelThreadService,
    private readonly inboxEventsService: InboxEventsService,
    private readonly cloud: WhatsappCloudClient,
    private readonly uploadService: UploadService
  ) {}

  // ---------------------------------------------------------------------------
  // Webhook
  // ---------------------------------------------------------------------------

  async getWebhook(query: any) {
    const mode = query?.["hub.mode"];
    const token = query?.["hub.verify_token"];
    const challenge = query?.["hub.challenge"];
    if (
      mode === "subscribe" &&
      token &&
      token === this.configService.get("social.verifyToken")
    ) {
      this.logger.debug(`Whatsapp Webhook verified!`);
      return challenge;
    }
    this.logger.debug(`Whatsapp Webhook verification failed.`);
    throw new HttpException("Webhook verification failed.", 403);
  }

  /**
   * Checks Meta's X-Hub-Signature-256. Returns true when no app secret is
   * configured (development), so enabling it is a pure config change.
   */
  verifySignature(rawBody: Buffer | undefined, header?: string): boolean {
    const secret = this.configService.get<string>(
      "social.whatsappCloud.appSecret"
    );
    if (!secret) return true;
    if (!rawBody || !header?.startsWith("sha256=")) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    const given = Buffer.from(header.slice("sha256=".length), "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  /** Process a webhook body. Never throws: Meta must always get its 200. */
  async handleWebhook(body: any): Promise<void> {
    let parsed: ReturnType<typeof parseCloudWebhook>;
    try {
      parsed = parseCloudWebhook(body);
    } catch (error) {
      this.logger.warn(`Unparseable WhatsApp webhook: ${error?.message}`);
      return;
    }
    await Promise.all([
      ...parsed.messages.map((m) =>
        this.serializePerContact(`${m.wabaId}:${m.from}`, () =>
          this.processInbound(m)
        )
      ),
      ...parsed.statuses.map((s) => this.applyStatus(s)),
    ]);
  }

  /**
   * Two messages from one customer can arrive in parallel webhooks. Both would
   * reach resolveConversation before either attached a conversation, splitting
   * the history across two conversations, so processing is chained per contact.
   */
  private serializePerContact(
    key: string,
    work: () => Promise<void>
  ): Promise<void> {
    const previous = this.inboundChains.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(work);
    this.inboundChains.set(key, next);
    void next.finally(() => {
      if (this.inboundChains.get(key) === next) this.inboundChains.delete(key);
    });
    return next;
  }

  /** Credentials for the account a webhook / thread belongs to (short TTL cache). */
  private async resolveAccount(
    ...keys: Array<string | undefined>
  ): Promise<CloudAccount | null> {
    const ids = keys.filter(Boolean) as string[];
    if (!ids.length) return null;
    const cacheKey = ids.join("|");
    const cached = this.accountCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const creds = await this.socialService
      .getChannelCredentials(SocialPlatformEnum.WHATSAPP, ids)
      .catch((error) => {
        this.logger.error(`WhatsApp credential lookup failed: ${error?.message}`);
        return null;
      });
    const value: CloudAccount | null = creds
      ? {
          accountId: creds.accountId,
          accessToken: creds.accessToken,
          phoneNumberId: creds.phoneNumberId,
          jarcubeBotId: creds.jarcubeBotId,
        }
      : null;
    this.accountCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ACCOUNT_CACHE_TTL_MS,
    });
    return value;
  }

  // ---------------------------------------------------------------------------
  // Inbound
  // ---------------------------------------------------------------------------

  private async processInbound(msg: CloudInboundMessage): Promise<void> {
    try {
      const account = await this.resolveAccount(msg.wabaId, msg.phoneNumberId);
      if (!account) {
        this.logger.warn(
          `No WhatsApp messenger for business ${msg.wabaId} / number ${msg.phoneNumberId}; message dropped`
        );
        return;
      }
      const botId = account.jarcubeBotId;

      // 1. Durable thread first, so the contact is always reachable later.
      const meta: Record<string, any> = { lastInboundAt: msg.time };
      if (msg.phoneNumberId) meta.phoneNumberId = msg.phoneNumberId;
      if (msg.displayPhoneNumber) meta.displayPhoneNumber = msg.displayPhoneNumber;
      if (msg.referral) meta.referral = msg.referral;
      const thread = await this.channelThreadService.upsertForInbound({
        channel: WA_CLOUD_CHANNEL,
        sessionName: account.accountId,
        chatId: msg.from,
        phone: msg.from,
        pushName: msg.profileName,
        bot: botId,
        meta,
      });
      const threadId = (thread._id as any).toString();
      const isNewThread = !thread.lastMessageAt;

      // 2. Visitor + conversation (also creates/links the CRM contact).
      const binding = await this.resolveConversation(thread, msg, botId);
      if (!binding) {
        this.logger.error(
          `Could not resolve a conversation for WhatsApp thread ${threadId}; message ${msg.messageId} not stored`
        );
        return;
      }

      // 3. Media is sent as an id; fetch and re-host it so the inbox can show it.
      const media = msg.media
        ? await this.storeInboundMedia(account, msg.media)
        : undefined;

      // 4. Persist. A Meta retry stops here.
      const { chat, created } = await this.conversationService.saveChannelMessage({
        conversationId: binding.conversationId,
        message: msg.text,
        sender: binding.visitorId,
        type: msg.type,
        time: msg.time,
        channelThread: threadId,
        externalMessageId: msg.messageId,
        direction: ChatDirectionEnum.INBOUND,
        authorName: msg.profileName,
        mediaUrl: media?.url,
        mimetype: msg.media?.mimetype,
        fileName: msg.media?.fileName,
        mediaOmitted: msg.media ? !media?.url : undefined,
        quotedMessageId: msg.quotedMessageId,
      } as any);
      if (!created) {
        this.logger.debug(
          `Duplicate WhatsApp message ${msg.messageId} ignored on thread ${threadId}`
        );
        return;
      }

      // 5. Inbox preview, unread badge, realtime fan-out.
      await this.channelThreadService.touchLastMessage(
        threadId,
        {
          message: msg.text || this.mediaPlaceholder(msg.type),
          type: msg.type,
          time: msg.time,
          direction: ChatDirectionEnum.INBOUND,
          sender: chat?.sender,
        },
        true
      );
      await this.announceToInbox(threadId, chat, botId);
      if (isNewThread) {
        // The first Cloud API thread is what makes the tab appear.
        await this.inboxEventsService
          .publishChannelsChanged({ botId, channel: WA_CLOUD_CHANNEL })
          .catch(() => undefined);
      }

      if (msg.storeOnly) return;

      // 6. Bot or the agent who owns the thread.
      await this.routeToBotOrAgent(thread, threadId, msg, binding, botId, account, media?.url);
    } catch (error) {
      this.logger.error(
        `WhatsApp inbound failed for ${msg?.from}/${msg?.messageId}: ${error?.message}`,
        error?.stack
      );
    }
  }

  /**
   * Reuse the thread's open conversation while its bot state is live; otherwise
   * let the shared initializer (re)build visitor, state and conversation, which
   * also captures the contact into the CRM. Same rule as WhatsApp Web.
   */
  private async resolveConversation(
    thread: any,
    msg: CloudInboundMessage,
    botId: string
  ): Promise<{ visitorId: string; conversationId: string } | null> {
    if (thread.visitor && thread.conversation) {
      const visitorId = thread.visitor.toString();
      const hasLiveState = !!this.socketStateService.getUserData(visitorId)
        ?.currentNode;
      if (hasLiveState) {
        const status = await this.conversationService
          .getConversationStatus(thread.conversation.toString())
          .catch(() => null);
        if (status === ConversationStatusEnum.IN_PROGRESS) {
          return { visitorId, conversationId: thread.conversation.toString() };
        }
      }
    }

    const visitor = await this.chatInitializerService.initializeChat(
      {
        name: msg.profileName || msg.from,
        username: msg.from,
        phone: msg.from,
        bot: botId,
        platform: PlatformEnum.WHATSAPP,
      },
      botId,
      {
        source: "whatsapp",
        details: { name: msg.profileName || undefined, phone: msg.from },
      }
    );
    if (!visitor?.visitorId) return null;
    const conversationId = this.socketStateService.getUserData(
      visitor.visitorId
    )?.conversationId;
    if (!conversationId) return null;

    await this.channelThreadService.attachConversation(
      (thread._id as any).toString(),
      { visitor: visitor.visitorId, conversation: conversationId, bot: botId }
    );
    return { visitorId: visitor.visitorId, conversationId };
  }

  /** Download inbound media from Meta and store it with the app's file storage. */
  private async storeInboundMedia(
    account: CloudAccount,
    media: { id: string; mimetype?: string; fileName?: string }
  ): Promise<{ url: string } | undefined> {
    try {
      const info = await this.cloud.getMediaInfo(account.accessToken, media.id);
      if (info?.file_size && info.file_size > this.cloud.maxMediaBytes) {
        this.logger.warn(`WhatsApp media ${media.id} too large (${info.file_size} bytes); not stored`);
        return undefined;
      }
      const buffer = await this.cloud.downloadMedia(account.accessToken, info.url);
      const url = await this.uploadService.uploadFile(
        {
          buffer,
          mimetype: info.mime_type || media.mimetype || "application/octet-stream",
          originalname: media.fileName,
        },
        "whatsapp"
      );
      return url ? { url } : undefined;
    } catch (error) {
      this.logger.warn(`Could not fetch WhatsApp media ${media.id}: ${error?.message}`);
      return undefined;
    }
  }

  private async routeToBotOrAgent(
    thread: any,
    threadId: string,
    msg: CloudInboundMessage,
    binding: { visitorId: string; conversationId: string },
    botId: string,
    account: CloudAccount,
    mediaUrl?: string
  ): Promise<void> {
    // Reply address for the bot path. The thread holds the durable copy.
    const ctx = {
      whatsappCloud: {
        accountId: account.accountId,
        phoneNumberId: msg.phoneNumberId || account.phoneNumberId,
        recipient: msg.from,
        threadId,
      },
      recipient: msg.from,
    };
    this.socketStateService.updateUserData(binding.visitorId, { ctx });

    const state = this.socketStateService.getUserData(binding.visitorId);
    const agentId = thread.assignedAgent?.toString() || state?.assignedAgentId;
    const handledByAgent = thread.handledByAgent || state?.handledByAgent;
    const value =
      msg.type === ChatTypeEnum.IMAGE && mediaUrl
        ? mediaUrl
        : msg.botInput || msg.text || this.mediaPlaceholder(msg.type);

    if (handledByAgent && agentId) {
      this.messageHandlerService.sendMessageToAgent(
        agentId,
        { type: msg.type, value, from: binding.visitorId },
        state
      );
      return;
    }

    if (thread.botEnabled === false) {
      this.logger.debug(`Bot disabled on WhatsApp thread ${threadId}; message stored only`);
      return;
    }

    await this.messageHandlerService.handleMessage(
      value,
      {
        auth: {
          userId: binding.visitorId,
          email: "",
          name: msg.profileName || msg.from,
          role: "visitor",
        },
      } as any,
      msg.type,
      state?.language || "en",
      ctx
    );
  }

  private async announceToInbox(threadId: string, chat: any, botId?: string) {
    if (!chat) return;
    try {
      const fresh = await this.channelThreadService.findByIdPopulated(threadId);
      if (!fresh) return;
      await this.inboxEventsService.publishMessage({
        botId,
        channel: WA_CLOUD_CHANNEL,
        threadId,
        message: toMessageView(chat),
        thread: toThreadView(fresh),
      });
    } catch (error) {
      this.logger.warn(`Inbox announce failed for WhatsApp thread ${threadId}: ${error?.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Delivery receipts
  // ---------------------------------------------------------------------------

  private async applyStatus(s: CloudStatusEvent): Promise<void> {
    try {
      const status = {
        sent: ChatStatusEnum.SENT,
        delivered: ChatStatusEnum.DELIVERED,
        read: ChatStatusEnum.READ,
        failed: ChatStatusEnum.FAILED,
      }[s.status];
      if (!status) return;
      if (status === ChatStatusEnum.FAILED) {
        const e = s.errors?.[0];
        this.logger.warn(
          `WhatsApp reported message ${s.messageId} failed: ${e?.code ?? ""} ${e?.title || e?.message || ""}`
        );
      }
      const updated = await this.conversationService.advanceChannelMessageStatus(
        s.messageId,
        status
      );
      if (!updated?.channelThread) return;
      const thread = await this.channelThreadService.findById(
        updated.channelThread.toString()
      );
      await this.inboxEventsService.publishMessageStatus({
        botId: thread?.bot ? String(thread.bot) : undefined,
        channel: WA_CLOUD_CHANNEL,
        threadId: updated.channelThread.toString(),
        externalMessageId: s.messageId,
        status: updated.status,
      });
    } catch (error) {
      this.logger.warn(`Failed to apply WhatsApp status for ${s?.messageId}: ${error?.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Outbound: bot replies (fire-and-forget, like WhatsApp Web's onSend)
  // ---------------------------------------------------------------------------

  @OnEvent(WA_CLOUD_SEND_EVENT, { async: true })
  async onSend(data: { ctx?: any; message: any; userId?: string }): Promise<void> {
    const message = data?.message;
    if (!message) return;

    const target = await this.resolveSendTarget(data).catch(() => null);
    if (!target) {
      this.logger.warn(`No WhatsApp reply address for user ${data?.userId}; message dropped`);
      return;
    }

    try {
      const externalMessageId = await this.deliver(target, message);
      if (!externalMessageId) return; // nothing sendable (e.g. empty text)

      const linked = await this.conversationService
        .linkOutboundChannelMessage({
          correlationId: message.id,
          threadId: target.threadId,
          externalMessageId,
        })
        .catch((e) => {
          this.logger.warn(`Failed to link WhatsApp outbound message: ${e?.message}`);
          return null;
        });

      if (target.threadId) {
        await this.channelThreadService.touchLastMessage(target.threadId, {
          message: message.value || this.mediaPlaceholder(message.type),
          type: message.type || ChatTypeEnum.TEXT,
          time: new Date(),
          direction: ChatDirectionEnum.OUTBOUND,
          sender: message.senderId || message.sender,
        });
        if (linked) {
          const thread = await this.channelThreadService.findById(target.threadId);
          await this.announceToInbox(
            target.threadId,
            linked,
            thread?.bot ? String(thread.bot) : undefined
          );
        }
      }
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${error?.message}`);
      await this.failOutboundReply(target, message).catch(() => undefined);
    }
  }

  private async failOutboundReply(target: SendTarget, message: any) {
    if (!message?.id) return;
    const failed = await this.conversationService
      .failOutboundByCorrelationId(message.id)
      .catch(() => null);
    if (!failed || !target.threadId) return;
    const thread = await this.channelThreadService.findById(target.threadId);
    await this.inboxEventsService
      .publishMessageStatus({
        botId: thread?.bot ? String(thread.bot) : undefined,
        channel: WA_CLOUD_CHANNEL,
        threadId: target.threadId,
        externalMessageId: message.id,
        status: ChatStatusEnum.FAILED,
      })
      .catch(() => undefined);
  }

  /** Live ctx first, then the durable thread (restart / idle eviction). */
  private async resolveSendTarget(data: {
    ctx?: any;
    userId?: string;
  }): Promise<SendTarget | null> {
    const wc = data?.ctx?.whatsappCloud;
    if (wc?.accountId && wc.recipient) {
      return {
        accountId: wc.accountId,
        phoneNumberId: wc.phoneNumberId,
        recipient: wc.recipient,
        threadId: wc.threadId,
      };
    }
    if (!data?.userId) return null;
    const fromThread = await this.channelThreadService.getReplyTargetByVisitor(
      data.userId
    );
    if (!fromThread || fromThread.channel !== WA_CLOUD_CHANNEL) return null;
    const thread = await this.channelThreadService.findById(fromThread.threadId);
    return {
      accountId: fromThread.sessionName,
      phoneNumberId: (thread as any)?.meta?.phoneNumberId,
      recipient: fromThread.phone || fromThread.chatId,
      threadId: fromThread.threadId,
    };
  }

  private async credentialsFor(target: SendTarget): Promise<CloudCredentials | null> {
    const account = await this.resolveAccount(target.accountId);
    if (!account) return null;
    const phoneNumberId = target.phoneNumberId || account.phoneNumberId;
    if (!phoneNumberId) return null;
    return { accessToken: account.accessToken, phoneNumberId };
  }

  /** Send one bot/agent message; returns Meta's id, or null when there is nothing to send. */
  private async deliver(target: SendTarget, message: any): Promise<string | null> {
    const creds = await this.credentialsFor(target);
    if (!creds) {
      throw new WhatsappCloudApiError(
        `No WhatsApp credentials / phone number id for account ${target.accountId}`
      );
    }
    const content = this.toCloudContent(message);
    if (!content) return null;
    return this.cloud.sendMessage(
      creds,
      target.recipient,
      content,
      this.isWamid(message.quotedMessageId) ? message.quotedMessageId : undefined
    );
  }

  private isWamid(id?: string): boolean {
    return typeof id === "string" && id.startsWith("wamid.");
  }

  /** Map our message types onto Cloud API content. */
  private toCloudContent(message: any): Record<string, any> | null {
    const value: string = message.value ?? "";
    const caption: string | undefined = message.caption || undefined;
    switch (message.type) {
      case ChatTypeEnum.IMAGE:
        return { type: "image", image: { link: value, ...(caption ? { caption } : {}) } };
      case ChatTypeEnum.VIDEO:
        return { type: "video", video: { link: value, ...(caption ? { caption } : {}) } };
      case ChatTypeEnum.AUDIO:
        return { type: "audio", audio: { link: value } };
      case ChatTypeEnum.FILE:
        return {
          type: "document",
          document: {
            link: value,
            ...(message.fileName ? { filename: message.fileName } : {}),
            ...(caption ? { caption } : {}),
          },
        };
      case ChatTypeEnum.MAPS: {
        const loc = message.location;
        if (loc?.latitude !== undefined && loc?.longitude !== undefined) {
          return {
            type: "location",
            location: {
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
              ...(loc.name ? { name: loc.name } : {}),
              ...(loc.address ? { address: loc.address } : {}),
            },
          };
        }
        return this.text(value);
      }
      case ChatTypeEnum.BUTTONS:
      case ChatTypeEnum.QUICK_REPLY:
        return this.options(value, message.buttons || []);
      case ChatTypeEnum.TEMPLATE: {
        const tpl = message.template;
        if (tpl?.url && this.isPublicHttpsUrl(tpl.url)) {
          return {
            type: "interactive",
            interactive: {
              type: "cta_url",
              body: { text: (tpl.bodyText || value || " ").slice(0, 1024) },
              action: {
                name: "cta_url",
                parameters: {
                  display_text: (tpl.buttonText || "Open").slice(0, 20),
                  url: tpl.url,
                },
              },
            },
          };
        }
        return this.text(value || (tpl?.url ? `${tpl.buttonText || "Open"}: ${tpl.url}` : ""));
      }
      case ChatTypeEnum.TEXT:
      default:
        return this.text(value);
    }
  }

  private text(body: string): Record<string, any> | null {
    if (!body) return null;
    return { type: "text", text: { preview_url: /https?:\/\//.test(body), body: body.slice(0, 4096) } };
  }

  /**
   * Bot options as native WhatsApp controls: up to 3 reply buttons (titles ≤ 20
   * chars), else a list (≤ 10 rows, titles ≤ 24), else a numbered text list.
   * The option's value goes in the id so the customer's tap feeds the flow the
   * same value the web widget sends.
   */
  private options(prompt: string, buttons: any[]): Record<string, any> | null {
    const opts = buttons
      .map((b) => ({
        title: String(b?.title ?? b?.value ?? "").trim(),
        id: String(b?.value ?? b?.title ?? "").slice(0, 256),
      }))
      .filter((o) => o.title && o.id);
    const body = (prompt || "Please choose an option").slice(0, 1024);
    if (!opts.length) return this.text(prompt);

    if (opts.length <= 3 && opts.every((o) => o.title.length <= 20)) {
      return {
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: body },
          action: {
            buttons: opts.map((o) => ({ type: "reply", reply: { id: o.id, title: o.title } })),
          },
        },
      };
    }
    if (opts.length <= 10) {
      return {
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: body },
          action: {
            button: "Choose",
            sections: [
              {
                title: "Options",
                rows: opts.map((o) => ({
                  id: o.id.slice(0, 200),
                  title: o.title.slice(0, 24),
                  ...(o.title.length > 24 ? { description: o.title.slice(0, 72) } : {}),
                })),
              },
            ],
          },
        },
      };
    }
    const lines = opts.map((o, i) => `${i + 1}. ${o.title}`).join("\n");
    return this.text([prompt, lines].filter(Boolean).join("\n"));
  }

  /** cta_url needs a public https URL; Meta drops anything else. */
  private isPublicHttpsUrl(value: string): boolean {
    try {
      const u = new URL(value);
      if (u.protocol !== "https:") return false;
      const h = u.hostname.toLowerCase();
      return !(
        h === "localhost" ||
        h.endsWith(".local") ||
        /^(127\.|10\.|192\.168\.|0\.0\.0\.0|::1)/.test(h) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(h)
      );
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Inbox intents (agent reply, read receipts, connection status)
  // ---------------------------------------------------------------------------

  /**
   * Deliver an agent reply and report the outcome. Registered WITHOUT
   * `{ async: true }` (see WhatsappWebInboundService.onInboxSendMessage): with
   * it, eventemitter2 returns a Timeout instead of this result and every reply
   * would be reported as failed.
   */
  @OnEvent(INBOX_SEND_MESSAGE_EVENT)
  async onInboxSendMessage(
    event: InboxSendMessageEvent
  ): Promise<InboxSendResult | null> {
    if (event?.channel !== WA_CLOUD_CHANNEL) return null;
    try {
      const thread: any = await this.channelThreadService.findById(event.threadId);
      if (!thread) return { accepted: false, reason: "no_reply_target" };

      const target: SendTarget = {
        accountId: event.sessionName || thread.sessionName,
        phoneNumberId: thread.meta?.phoneNumberId,
        recipient: thread.phone || event.chatId,
        threadId: event.threadId,
      };
      const creds = await this.credentialsFor(target);
      if (!creds) {
        return {
          accepted: false,
          reason: "session_not_connected",
          detail: `no WhatsApp messenger / phone number id for ${target.accountId}`,
        };
      }

      // Free-form replies are only allowed within 24h of the customer's last
      // message. Refuse up front with a clear reason instead of a Graph error.
      const lastInbound = thread.meta?.lastInboundAt
        ? new Date(thread.meta.lastInboundAt).getTime()
        : null;
      if (lastInbound && Date.now() - lastInbound > SERVICE_WINDOW_MS) {
        return {
          accepted: false,
          reason: "outside_service_window",
          detail: "more than 24h since the customer's last message",
        };
      }

      const isMedia = !!event.mediaUrl;
      const type = isMedia ? this.mediaTypeFor(event.type, event.mimetype) : ChatTypeEnum.TEXT;
      const content = this.toCloudContent({
        type,
        value: isMedia ? event.mediaUrl : event.message,
        caption: isMedia ? event.message || undefined : undefined,
        fileName: event.fileName,
      });
      if (!content) return { accepted: false, reason: "invalid_send_request", detail: "empty message" };

      const externalMessageId = await this.cloud.sendMessage(
        creds,
        target.recipient,
        content,
        this.isWamid(event.quotedMessageId) ? event.quotedMessageId : undefined
      );
      return { accepted: true, externalMessageId, timestamp: new Date() };
    } catch (error) {
      return this.classifySendError(error);
    }
  }

  private mediaTypeFor(type?: string, mimetype?: string): string {
    if (type && type !== ChatTypeEnum.TEXT && type !== ChatTypeEnum.FILE) return type;
    if (mimetype?.startsWith("image/")) return ChatTypeEnum.IMAGE;
    if (mimetype?.startsWith("video/")) return ChatTypeEnum.VIDEO;
    if (mimetype?.startsWith("audio/")) return ChatTypeEnum.AUDIO;
    return ChatTypeEnum.FILE;
  }

  private classifySendError(error: any): InboxSendResult {
    const code = error instanceof WhatsappCloudApiError ? error.code : undefined;
    const detail = [error?.message, error?.details].filter(Boolean).join(" — ");
    if (code !== undefined && SERVICE_WINDOW_ERROR_CODES.has(code)) {
      return { accepted: false, reason: "outside_service_window", detail };
    }
    if (code !== undefined && AUTH_ERROR_CODES.has(code)) {
      return { accepted: false, reason: "session_not_connected", detail };
    }
    if (code !== undefined && RATE_LIMIT_ERROR_CODES.has(code)) {
      return { accepted: false, reason: "rate_limited", detail };
    }
    if (error?.httpStatus && error.httpStatus >= 400 && error.httpStatus < 500) {
      return { accepted: false, reason: "invalid_send_request", detail };
    }
    return { accepted: false, reason: "channel_send_failed", detail };
  }

  /** Blue ticks for what the agent has read. Best-effort. */
  @OnEvent(INBOX_MARK_READ_EVENT, { async: true })
  async onInboxMarkRead(event: InboxMarkReadEvent): Promise<void> {
    if (event?.channel !== WA_CLOUD_CHANNEL) return;
    const ids = (event.externalMessageIds || []).filter((id) => this.isWamid(id));
    if (!ids.length) return;
    try {
      const thread: any = await this.channelThreadService.findByKey({
        channel: WA_CLOUD_CHANNEL,
        sessionName: event.sessionName,
        chatId: event.chatId,
      });
      const creds = await this.credentialsFor({
        accountId: event.sessionName,
        phoneNumberId: thread?.meta?.phoneNumberId,
        recipient: event.chatId,
      });
      if (!creds) return;
      // Reading the newest one marks every earlier message read too.
      await this.cloud.markRead(creds, ids[ids.length - 1]);
    } catch (error) {
      this.logger.warn(`WhatsApp read receipt failed for ${event.chatId}: ${error?.message}`);
    }
  }

  /** Inbox banner: is any Cloud API messenger configured for this scope? */
  @OnEvent(INBOX_CHANNEL_STATUS_EVENT)
  async onInboxChannelStatus(
    query: InboxChannelStatusQuery
  ): Promise<InboxChannelStatusResult | null> {
    if (query?.channel !== WA_CLOUD_CHANNEL) return null;
    try {
      const accounts = await this.socialService.listChannelAccounts(
        SocialPlatformEnum.WHATSAPP,
        query.botIds
      );
      // A Cloud API number has no session to drop: if the messenger exists,
      // the channel is usable (token problems surface on the send itself).
      return {
        channel: WA_CLOUD_CHANNEL,
        state: accounts.length ? "connected" : "removed",
        connected: accounts.length > 0,
        accounts: accounts.map((a) => ({
          sessionName: a.accountId,
          label: a.name,
          state: "connected" as const,
        })),
      };
    } catch (error) {
      this.logger.warn(`WhatsApp channel status failed: ${error?.message}`);
      return { channel: WA_CLOUD_CHANNEL, state: "unknown", connected: false, accounts: [] };
    }
  }

  private mediaPlaceholder(type: string): string {
    switch (type) {
      case ChatTypeEnum.IMAGE:
        return "📷 Photo";
      case ChatTypeEnum.VIDEO:
        return "🎥 Video";
      case ChatTypeEnum.AUDIO:
        return "🎤 Audio";
      case ChatTypeEnum.FILE:
        return "📄 Document";
      case ChatTypeEnum.MAPS:
        return "📍 Location";
      default:
        return "";
    }
  }
}
