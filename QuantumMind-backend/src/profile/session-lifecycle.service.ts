import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { ServiceRequestTranscriptService } from "src/crm/service-requests/service-request-transcript.service";

const SNAPSHOT_TIMEOUT_MS = 10_000;

/** Rejects after `ms`; a slow CRM must not hold the lease, and the chats stay. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("service request snapshot timed out")), ms);
      (timer as any).unref?.();
    }),
  ]).finally(() => clearTimeout(timer));
}
import { Cron } from "@nestjs/schedule";
import mongoose, { Connection, Types } from "mongoose";
import { isFeatureOn } from "src/common/features";
import { DATABASE_PROVIDER } from "src/constants";
import { CONVERSATION_ENDED } from "src/handover-alert/constants";
import { INCIDENT_CLOSED } from "src/incident/constants";
import { OPEN_INCIDENT_STATUSES } from "src/incident/enums/incident.enum";
import {
  allowFallbackOn,
  decideLifecycle,
  EXPIRED_QUIET_MS,
  finalState,
  MAX_MERGE_RUNS,
  PurgeMode,
  TranscriptPlan,
} from "./lifecycle";
import { ProfileMergeFailed, ProfileService } from "./profile.service";

const LEASE_MS = 15 * 60_000;
const SWEEP_LIMIT = 200;
/** A missed end event is picked up by the daily run after this long. */
const MISSED_AFTER_MS = 60 * 60_000;

export type LifecycleResult =
  | "skipped"
  | "busy"
  | "kept_open_incident"
  | "purged"
  | "summarised"
  | "would_purge"
  | "pending_merge"
  | "kept_no_contact";

/**
 * Session end -> Visitor_Profile -> chat purge (crm-incident-handover R18,
 * design §8, rollout §2). Behind the bot's `profileSummaries` flag and the
 * global PROFILE_PURGE_MODE (default `dry_run`: profiles are merged, chats
 * are only marked `would_purge`).
 *
 * Property 7: chats are deleted only after a successful merge (or for a
 * conversation with no contact and no incident, R18.7). A failed merge keeps
 * them and the daily run retries (R18.10).
 */
@Injectable()
export class SessionLifecycleService {
  private readonly logger = new Logger(SessionLifecycleService.name);
  private dailyRunning = false;

  constructor(
    private readonly profiles: ProfileService,
    private readonly config: ConfigService,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
    // crm-plugins-service-desk R16.2: a conversation's service requests keep
    // a copy of the chat before it is deleted.
    @Optional() private readonly transcripts?: ServiceRequestTranscriptService,
  ) {}

  get mode(): PurgeMode {
    return this.config.get("crm.profilePurgeMode") === "live" ? "live" : "dry_run";
  }

  @OnEvent(CONVERSATION_ENDED, { async: true })
  async onConversationEnded(p: { conversationId: string; cause?: string }) {
    // The agent handed the chat back to the bot: the conversation goes on.
    if (!p?.conversationId || p.cause === "agent_release") return;
    await this.process(String(p.conversationId)).catch((e) =>
      this.logger.error(`Session lifecycle for ${p.conversationId} failed: ${e?.message}`),
    );
  }

  /** R18.6: the transcript was kept for the agent; now it can be summarised. */
  @OnEvent(INCIDENT_CLOSED, { async: true })
  async onIncidentClosed(p: { conversationId?: string }) {
    if (!p?.conversationId) return;
    await this.process(String(p.conversationId)).catch((e) =>
      this.logger.error(`Session lifecycle after incident close for ${p.conversationId} failed: ${e?.message}`),
    );
  }

  async process(conversationId: string, opts: { daily?: boolean; now?: Date } = {}): Promise<LifecycleResult> {
    if (!Types.ObjectId.isValid(conversationId)) return "skipped";
    const now = opts.now ?? new Date();
    const Conversation = this.model("Conversation");
    const Incident = this.model("Incident");
    if (!Conversation) return "skipped";
    const conv: any = await Conversation.findById(conversationId)
      .select("bot platform crmContactId endedAt status transcriptState transcriptPlan mergeAttempts messageCount")
      .lean();
    if (!conv) return "skipped";

    const ended = !!conv.endedAt || conv.status === "completed" || conv.status === "expired";
    let recentActivity = false;
    if (ended && !conv.endedAt) {
      const last: any = await this.model("Chat")?.findOne({ conversationId }).sort({ time: -1 }).select("time createdAt").lean();
      const t = last ? new Date(last.time ?? last.createdAt).getTime() : 0;
      recentActivity = !!t && now.getTime() - t < EXPIRED_QUIET_MS;
    }
    const [flagOn, openIncident, anyIncident] = await Promise.all([
      this.flagOn(conv.bot),
      Incident?.exists({ conversationId: String(conversationId), status: { $in: [...OPEN_INCIDENT_STATUSES] } }),
      Incident?.findOne({ conversationId: String(conversationId) }).select("crmContactId").lean(),
    ]);
    const decision = decideLifecycle({
      platform: conv.platform,
      ended,
      recentActivity,
      flagOn,
      state: conv.transcriptState,
      mode: this.mode,
      openIncident: !!openIncident,
      hasIncident: !!anyIncident,
      contactId: conv.crmContactId || (anyIncident as any)?.crmContactId,
      plan: conv.transcriptPlan,
    });
    if (decision.action === "skip") return "skipped";
    if (decision.action === "keep") return "kept_open_incident";

    // One worker per conversation (end event, incident close, daily run).
    const lease = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        transcriptState: { $nin: ["summarised", "purged"] },
        $or: [{ lifecycleLeaseUntil: { $exists: false } }, { lifecycleLeaseUntil: { $lt: now } }],
      },
      { $set: { lifecycleLeaseUntil: new Date(now.getTime() + LEASE_MS) } },
      { new: true },
    ).lean();
    if (!lease) return "busy";

    try {
      if (decision.action === "finish") return await this.finish(conversationId, decision.plan, "live");
      if (decision.action === "purge") return await this.finish(conversationId, "purge", this.mode);

      const attempts = Number(conv.mergeAttempts) || 0;
      try {
        await this.profiles.merge(conversationId, { allowFallback: opts.daily === true && allowFallbackOn(attempts) });
      } catch (error) {
        const reason = error?.message || String(error);
        const exhausted = attempts + 1 >= MAX_MERGE_RUNS;
        // Nothing can ever be merged without a contact: stop retrying, keep the chats.
        const noContact = error instanceof ProfileMergeFailed && /no CRM contact|not found or archived/.test(reason);
        const state = exhausted && noContact ? "kept" : "pending_merge";
        await Conversation.updateOne(
          { _id: conversationId },
          {
            $set: { transcriptState: state, lastMergeError: reason.slice(0, 500), lastMergeAt: now },
            $inc: { mergeAttempts: 1 },
          },
        );
        this.logger.warn(`Profile merge for ${conversationId} failed (${attempts + 1}/${MAX_MERGE_RUNS}): ${reason}`);
        return state === "kept" ? "kept_no_contact" : "pending_merge";
      }
      return await this.finish(conversationId, "summarise", this.mode);
    } finally {
      await Conversation.updateOne({ _id: conversationId }, { $unset: { lifecycleLeaseUntil: "" } }).catch(() => undefined);
    }
  }

  /**
   * Write the counters, then delete (live) or only mark (dry run). The state
   * goes first so a crash between the two leaves a `summarised`/`purged`
   * conversation with rows, which the daily run deletes again.
   */
  private async finish(conversationId: string, plan: TranscriptPlan, mode: PurgeMode): Promise<LifecycleResult> {
    const Conversation = this.model("Conversation")!;
    const Chat = this.model("Chat");
    const count = (await Chat?.countDocuments({ conversationId })) ?? 0;
    const conv: any = await Conversation.findById(conversationId).select("messageCount").lean();
    const state = finalState(plan, mode);
    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          transcriptState: state,
          transcriptPlan: plan,
          messageCount: Math.max(Number(conv?.messageCount) || 0, count),
          ...(plan === "summarise" ? { lastMergeError: null } : {}),
        },
      },
    );
    if (state === "would_purge") {
      this.logger.log(`[dry-run] conversation ${conversationId} would be ${plan === "purge" ? "purged" : "summarised"} (${count} chats kept)`);
      return "would_purge";
    }
    await this.deleteChats(conversationId);
    return state;
  }

  /**
   * Throws (and deletes nothing) when the service request snapshot fails,
   * so the chats stay and the daily repair run tries again (R16.2, Property 9).
   */
  private async deleteChats(conversationId: string) {
    if (this.transcripts) {
      await withTimeout(this.transcripts.snapshotForConversation(conversationId), SNAPSHOT_TIMEOUT_MS);
    }
    const res: any = await this.model("Chat")?.deleteMany({ conversationId });
    await this.model("Conversation")!.updateOne({ _id: conversationId }, { $set: { chats: [], purgedAt: new Date() } });
    this.logger.log(`Deleted ${res?.deletedCount ?? 0} chats of conversation ${conversationId}`);
  }

  // --------------------------------------------------------------- daily

  /** Retries, repairs and the dry-run report (R18.10, rollout §2). */
  @Cron("0 30 3 * * *", { name: "profile-session-lifecycle" })
  async runDaily(now: Date = new Date()): Promise<Record<string, number>> {
    if (this.dailyRunning) return {};
    this.dailyRunning = true;
    const counts: Record<string, number> = {};
    const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);
    try {
      const Conversation = this.model("Conversation");
      if (!Conversation) return counts;
      const run = async (ids: any[]) => {
        for (const c of ids) {
          try {
            bump(await this.process(String(c._id), { daily: true, now }));
          } catch (error) {
            bump("error");
            this.logger.warn(`Daily lifecycle for ${c._id} failed: ${error?.message}`);
          }
        }
      };
      const botIds = await this.enabledBotIds();
      if (!botIds.length) return counts;
      // Repair: marked done in live mode but the delete did not happen.
      if (this.mode === "live") {
        const leftovers = await Conversation.find({
          bot: { $in: botIds },
          transcriptState: { $in: ["summarised", "purged"] },
          "chats.0": { $exists: true },
        }).select("_id").limit(SWEEP_LIMIT).lean();
        for (const c of leftovers) {
          await this.deleteChats(String((c as any)._id)).catch(() => bump("error"));
          bump("repaired");
        }
      }
      await run(
        await Conversation.find({ bot: { $in: botIds }, transcriptState: "pending_merge" })
          .select("_id").sort({ lastMergeAt: 1 }).limit(SWEEP_LIMIT).lean(),
      );
      if (this.mode === "live") {
        await run(await Conversation.find({ bot: { $in: botIds }, transcriptState: "would_purge" }).select("_id").limit(SWEEP_LIMIT).lean());
      }
      // Missed end events (restart, crash): ended a while ago, still untouched.
      await run(
        await Conversation.find({
          bot: { $in: botIds },
          $and: [
            { $or: [{ transcriptState: "kept" }, { transcriptState: { $exists: false } }] },
            { $or: [{ endedAt: { $lte: new Date(now.getTime() - MISSED_AFTER_MS) } }, { status: "expired", updatedAt: { $lte: new Date(now.getTime() - MISSED_AFTER_MS) } }] },
          ],
          incidentOpen: { $ne: true },
          mergeAttempts: { $lt: MAX_MERGE_RUNS },
        }).select("_id").limit(SWEEP_LIMIT).lean(),
      );
      const wouldPurge = await Conversation.countDocuments({ bot: { $in: botIds }, transcriptState: "would_purge" });
      this.logger.log(`[profile lifecycle] mode=${this.mode} run=${JSON.stringify(counts)} would_purge_total=${wouldPurge}`);
      return counts;
    } catch (error) {
      this.logger.error(`Daily profile lifecycle failed: ${error?.message}`);
      return counts;
    } finally {
      this.dailyRunning = false;
    }
  }

  private async flagOn(botId: any): Promise<boolean> {
    if (!botId) return false;
    const bot: any = await this.model("Bot")?.findById(botId).select("botSetting").lean().catch(() => null);
    if (!bot?.botSetting) return false;
    const s: any = await this.model("BotSetting")?.findById(bot.botSetting).select("features").lean().catch(() => null);
    return isFeatureOn(s, "profileSummaries");
  }

  private async enabledBotIds(): Promise<any[]> {
    const settings = await this.model("BotSetting")?.find({ "features.profileSummaries": true }).select("_id").lean();
    if (!settings?.length) return [];
    const bots = await this.model("Bot")?.find({ botSetting: { $in: settings.map((s: any) => s._id) } }).select("_id").lean();
    return (bots ?? []).map((b: any) => b._id);
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}
