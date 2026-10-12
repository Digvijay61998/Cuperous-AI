import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Model } from "mongoose";
import * as mongoose from "mongoose";
import { AgentService } from "src/agent/agent.service";
import { ChannelThreadService } from "src/channel-thread/channel-thread.service";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { InboxEventsService } from "src/inbox/inbox-events.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import {
  ANONYMOUS_VISITOR_NAME,
  HANDOVER_ACKNOWLEDGED_EVENT,
  HANDOVER_ALERT_PROVIDER,
  HANDOVER_PENDING_EVENT,
  HANDOVER_REQUESTED_EVENT,
  MAX_HANDOVER_REASON_LENGTH,
  PERSIST_RETRY_DELAYS_MS,
} from "./constants";
import { HandoverAlertDocument } from "./entities/handover-alert.entity";
import {
  AlertPriorityEnum,
  AlertReasonEnum,
  AlertResolutionEnum,
  AlertStatusEnum,
  priorityForReason,
} from "./enums/handover-alert.enum";

export interface RaiseHandoverInput {
  conversationId: string;
  botId: string;
  visitorId?: string;
  visitorName?: string;
  threadId?: string;
  reason: AlertReasonEnum;
  handoverReason?: string;
  agentAssigned?: boolean;
  assignedAgentId?: string;
  mode?: string;
}

export interface HandoverAlertView {
  id: string;
  conversationId: string;
  threadId?: string;
  botId: string;
  visitorName: string;
  reason: string;
  handoverReason?: string;
  priority: string;
  createdAt: string;
  agentAssigned: boolean;
  updated?: boolean;
}

export interface AlertUser {
  _id?: any;
  userId?: any;
  organizationId?: any;
}

const isDuplicateKey = (e: any) => e?.code === 11000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const idOf = (u: AlertUser) => String(u?._id ?? u?.userId ?? "");

export function toAlertView(
  doc: any,
  extra: Partial<HandoverAlertView> = {},
): HandoverAlertView {
  return {
    id: String(doc._id),
    conversationId: String(doc.conversationId),
    threadId: doc.threadId ? String(doc.threadId) : undefined,
    botId: String(doc.botId),
    visitorName: doc.visitorName || ANONYMOUS_VISITOR_NAME,
    reason: doc.reason,
    handoverReason: doc.handoverReason || undefined,
    priority: doc.priority,
    createdAt: new Date(doc.createdAt ?? Date.now()).toISOString(),
    agentAssigned: !!doc.agentAssigned,
    ...extra,
  };
}

/**
 * Owns the lifecycle of Handover_Alerts: the ONLY source of the agent alert
 * sound. Everything here is best-effort with respect to the visitor flow — no
 * method throws into the message pipeline except the HTTP-facing `acknowledge`.
 */
@Injectable()
export class HandoverAlertService {
  private readonly logger = new Logger(HandoverAlertService.name);

  constructor(
    @Inject(HANDOVER_ALERT_PROVIDER)
    private readonly alertModel: Model<HandoverAlertDocument>,
    private readonly agentService: AgentService,
    private readonly inboxEventsService: InboxEventsService,
    private readonly channelThreadService: ChannelThreadService,
  ) {}

  /**
   * Raise (or fold into) the Handover_Alert for a conversation.
   *
   * - preview mode → no alert.
   * - no open alert → insert + emit `inbox:handover-requested`.
   * - already open → no new alert; an emergency trigger upgrades priority once.
   */
  async raise(input: RaiseHandoverInput): Promise<HandoverAlertView | null> {
    try {
      if (input.mode === ModeEnum.preview) return null;
      if (!input.conversationId || !input.botId) return null;

      const reason = input.reason;
      const priority = priorityForReason(reason);

      const existing = await this.alertModel
        .findOne({
          conversationId: String(input.conversationId),
          status: AlertStatusEnum.OPEN,
        })
        .lean();
      if (existing) return this.foldIntoOpen(existing, reason);

      const recipients = await this.resolveRecipients(
        input.botId,
        input.agentAssigned ? input.assignedAgentId : undefined,
      );
      const organizationId = await this.botOrganizationId(input.botId);
      const threadId =
        input.threadId ?? (await this.findWidgetThreadId(input.conversationId));

      const doc = {
        organizationId,
        botId: input.botId,
        conversationId: String(input.conversationId),
        threadId,
        visitorId: input.visitorId,
        visitorName: input.visitorName?.trim() || ANONYMOUS_VISITOR_NAME,
        reason,
        handoverReason: input.handoverReason
          ? String(input.handoverReason).slice(0, MAX_HANDOVER_REASON_LENGTH)
          : undefined,
        priority,
        recipients,
        agentAssigned: !!input.agentAssigned,
        assignedAgentId: input.agentAssigned ? input.assignedAgentId : undefined,
        status: AlertStatusEnum.OPEN,
      };

      let created: any = null;
      for (let attempt = 0; ; attempt++) {
        try {
          created = (await this.alertModel.create(doc)).toObject();
          break;
        } catch (error) {
          if (isDuplicateKey(error)) {
            // Lost a race against another trigger for the same conversation.
            const winner = await this.alertModel
              .findOne({
                conversationId: doc.conversationId,
                status: AlertStatusEnum.OPEN,
              })
              .lean();
            return winner ? this.foldIntoOpen(winner, reason) : null;
          }
          if (attempt >= PERSIST_RETRY_DELAYS_MS.length) {
            this.logger.error(
              `Handover alert persist failed for conversation ${doc.conversationId}: ${error?.message}`,
            );
            return null;
          }
          await sleep(PERSIST_RETRY_DELAYS_MS[attempt]);
        }
      }

      const view = toAlertView(created);
      this.inboxEventsService.emitToUsers(
        created.recipients,
        HANDOVER_REQUESTED_EVENT,
        view,
      );
      return view;
    } catch (error) {
      this.logger.error(`Handover raise failed: ${error?.message}`);
      return null;
    }
  }

  /** Record the agent picked by TransferToAgent (recipients stay as-is). */
  async setAssigned(conversationId: string, agentId: string): Promise<void> {
    try {
      await this.alertModel.updateOne(
        { conversationId: String(conversationId), status: AlertStatusEnum.OPEN },
        {
          $set: { agentAssigned: true, assignedAgentId: String(agentId) },
          $addToSet: { recipients: String(agentId) },
        },
      );
    } catch (error) {
      this.logger.warn(`Handover setAssigned failed: ${error?.message}`);
    }
  }

  /** HTTP-facing acknowledgement; enforces recipient + org scope. */
  async acknowledge(
    alertId: string,
    user: AlertUser,
    resolution: AlertResolutionEnum,
  ): Promise<HandoverAlertView> {
    if (!mongoose.isValidObjectId(alertId)) {
      throw new NotFoundException("Alert not found");
    }
    const alert = await this.alertModel.findById(alertId).lean();
    if (!alert) throw new NotFoundException("Alert not found");
    if (!this.canSee(alert, user)) {
      throw new ForbiddenException("Not allowed to acknowledge this alert");
    }
    const acked = await this.ackWhere({ _id: alert._id }, idOf(user), resolution);
    return toAlertView(acked[0] ?? alert);
  }

  /** Thread opened / taken over in the inbox by `userId`. */
  async acknowledgeByThread(
    threadId: string,
    userId: string,
    resolution: AlertResolutionEnum,
  ): Promise<void> {
    try {
      if (!threadId) return;
      await this.ackWhere(
        { threadId, recipients: String(userId) },
        String(userId),
        resolution,
      );
    } catch (error) {
      this.logger.warn(`Handover ack by thread failed: ${error?.message}`);
    }
  }

  async acknowledgeByConversation(
    conversationId: string,
    resolution: AlertResolutionEnum,
    userId?: string,
  ): Promise<void> {
    try {
      if (!conversationId) return;
      await this.ackWhere(
        { conversationId: String(conversationId) },
        userId,
        resolution,
      );
    } catch (error) {
      this.logger.warn(`Handover ack by conversation failed: ${error?.message}`);
    }
  }

  async listOpenForUser(user: AlertUser): Promise<HandoverAlertView[]> {
    const userId = idOf(user);
    if (!userId) return [];
    const docs = await this.alertModel
      .find({
        status: AlertStatusEnum.OPEN,
        recipients: userId,
        organizationId: user.organizationId ?? null,
      })
      .sort({ createdAt: 1 })
      .lean();
    return docs
      .map((d) => toAlertView(d))
      .sort(
        (a, b) =>
          Number(b.priority === AlertPriorityEnum.HIGH) -
            Number(a.priority === AlertPriorityEnum.HIGH) ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }

  /** An agent came online: give them pending alerts for their bots. */
  async replayForAgentOnline(agentId: string): Promise<void> {
    try {
      const docs = await this.alertModel
        .find({ status: AlertStatusEnum.OPEN, recipients: String(agentId) })
        .lean();
      if (!docs.length) return;
      this.inboxEventsService.emitToUsers([String(agentId)], HANDOVER_PENDING_EVENT, {
        alerts: docs.map((d) => toAlertView(d)),
        playOnce: true,
      });
    } catch (error) {
      this.logger.warn(`Handover replay failed: ${error?.message}`);
    }
  }

  /** Fill in the thread id once the widget bridge has created the thread. */
  async setThreadIfMissing(conversationId: string, threadId: string): Promise<void> {
    try {
      await this.alertModel.updateMany(
        {
          conversationId: String(conversationId),
          status: AlertStatusEnum.OPEN,
          threadId: { $exists: false },
        },
        { $set: { threadId } },
      );
    } catch {
      /* best effort */
    }
  }

  /** Inbox thread id of a widget conversation, if one exists (R9.2). */
  async threadIdForConversation(conversationId: string): Promise<string | undefined> {
    const id = await this.findWidgetThreadId(conversationId);
    return id ? String(id) : undefined;
  }

  async hasOpenAlert(conversationId: string): Promise<boolean> {
    return !!(await this.alertModel.exists({
      conversationId: String(conversationId),
      status: AlertStatusEnum.OPEN,
    }));
  }

  // ---------------------------------------------------------------------------

  private canSee(alert: any, user: AlertUser): boolean {
    const uid = idOf(user);
    const sameOrg =
      String(alert.organizationId ?? "") === String(user?.organizationId ?? "");
    return !!uid && sameOrg && (alert.recipients || []).includes(uid);
  }

  /** An emergency upgrades an open normal alert exactly once; anything else is a no-op. */
  private async foldIntoOpen(
    open: any,
    reason: AlertReasonEnum,
  ): Promise<HandoverAlertView | null> {
    if (reason !== AlertReasonEnum.EMERGENCY) return toAlertView(open);
    const upgraded = await this.alertModel
      .findOneAndUpdate(
        { _id: open._id, status: AlertStatusEnum.OPEN, priority: AlertPriorityEnum.NORMAL },
        { $set: { priority: AlertPriorityEnum.HIGH, reason: AlertReasonEnum.EMERGENCY } },
        { new: true },
      )
      .lean();
    if (!upgraded) return toAlertView(open);
    const view = toAlertView(upgraded, { updated: true });
    this.inboxEventsService.emitToUsers(
      (upgraded as any).recipients,
      HANDOVER_REQUESTED_EVENT,
      view,
    );
    return view;
  }

  /** First-wins acknowledgement of every open alert matching `filter`. */
  private async ackWhere(
    filter: Record<string, any>,
    userId: string | undefined,
    resolution: AlertResolutionEnum,
  ): Promise<any[]> {
    const candidates = await this.alertModel
      .find({ ...filter, status: AlertStatusEnum.OPEN })
      .select("_id")
      .lean();
    const acked: any[] = [];
    for (const c of candidates) {
      const doc = await this.alertModel
        .findOneAndUpdate(
          { _id: c._id, status: AlertStatusEnum.OPEN },
          {
            $set: {
              status: AlertStatusEnum.ACKNOWLEDGED,
              resolution,
              ackBy: userId,
              ackAt: new Date(),
            },
          },
          { new: true },
        )
        .lean();
      if (!doc) continue; // someone else acknowledged first
      acked.push(doc);
      this.inboxEventsService.emitToUsers((doc as any).recipients, HANDOVER_ACKNOWLEDGED_EVENT, {
        id: String(doc._id),
        conversationId: String((doc as any).conversationId),
        threadId: (doc as any).threadId ? String((doc as any).threadId) : undefined,
        resolution,
        ackBy: userId,
      });
    }
    return acked;
  }

  private async resolveRecipients(
    botId: string,
    assignedAgentId?: string,
  ): Promise<string[]> {
    const ids = assignedAgentId
      ? [String(assignedAgentId), ...(await this.agentService.findOrgAdminIds(botId))]
      : await this.agentService.findInboxRecipientIds(botId);
    return [...new Set(ids.map(String))];
  }

  private async botOrganizationId(botId: string): Promise<any> {
    try {
      if (!mongoose.isValidObjectId(botId)) return null;
      const bot = await mongoose
        .model("Bot")
        .findById(botId)
        .select("organizationId")
        .lean();
      return (bot as any)?.organizationId ?? null;
    } catch {
      return null;
    }
  }

  private async findWidgetThreadId(conversationId: string): Promise<any> {
    try {
      const thread = await this.channelThreadService.findByKey({
        channel: PlatformEnum.WIDGET,
        chatId: String(conversationId),
      });
      return thread?._id;
    } catch {
      return undefined;
    }
  }
}
