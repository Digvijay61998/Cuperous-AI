import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ActivityType, Prisma } from "@prisma/client";
import mongoose, { Connection, Types } from "mongoose";
import { AiService } from "src/ai/ai.service";
import type { ProfileMergeRequest } from "src/ai/ai-crm.types";
import { maskPii } from "src/common/pii/mask";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { resolveOrgTimeZone } from "src/common/time/org-time";
import { DATABASE_PROVIDER } from "src/constants";
import { CHAT_SYSTEM_USER } from "src/crm-bridge/contact-resolver.service";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { deriveSenderRole } from "src/inbox/inbox.mapper";
import {
  checkMerged,
  clearFactOverride,
  deleteEntry,
  fallbackEntry,
  insertEntry,
  OverrideKey,
  parseProfile,
  profileForAi,
  ProfileInvalidError,
  rebase,
  setFactOverride,
  VisitorProfile,
  VisitorProfileEntry,
} from "./profile-schema";

/** Waits before the 1st, 2nd and 3rd retry (R11.6). */
export const MERGE_RETRY_DELAYS_MS = [30_000, 60_000, 120_000];
/** Chats sent to the AI per conversation (the end of a long chat is kept). */
const MERGE_MAX_CHATS = 500;
const CHAT_TEXT_MAX = 4000;
/** How long the AI-answer context for a conversation is cached. */
const CONTEXT_TTL_MS = 5 * 60_000;
const CONTEXT_EMPTY_TTL_MS = 60_000;
const CONTEXT_CACHE_MAX = 2000;

export class ProfileMergeFailed extends Error {}

export interface MergeOutcome {
  status: "merged" | "already";
  /** False when the deterministic fallback entry was written (R11.7). */
  ai: boolean;
  entry?: VisitorProfileEntry;
  contactId: string;
}

/**
 * The rolling Visitor_Profile (crm-incident-handover R18, design §9).
 *
 * Merge concurrency (R18.11, Property 6): the AI call takes up to minutes with
 * retries, so no row lock is held across it. The write is a compare-and-set
 * under `SELECT … FOR UPDATE` on the contact row: if `profileVersion` moved
 * (another conversation of the same contact, an admin edit, an anonymous
 * merge), this merge is rebased onto the latest profile, so no update is lost.
 *
 * Only masked text reaches the AI and the profile (R11.5). Raw identifiers stay
 * in the contact's own columns.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  /** Overridable in tests. */
  retryDelaysMs: readonly number[] = MERGE_RETRY_DELAYS_MS;
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms));
  private readonly contextCache = new Map<string, { at: number; value: Record<string, unknown> | null }>();

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly ai: AiService,
    private readonly tenantScope: TenantScopeService,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
  ) {}

  // ------------------------------------------------------------- merge

  /**
   * Fold one ended conversation into its contact's profile (R18.2–R18.4).
   * `allowFallback`: after the AI fails every attempt, write the deterministic
   * `ai: false` entry instead of failing (used once the daily retries are
   * exhausted). Throws ProfileMergeFailed when nothing was written.
   */
  async merge(conversationId: string, opts: { allowFallback?: boolean } = {}): Promise<MergeOutcome> {
    const ctx = await this.loadContext(conversationId);
    const db = this.crm.forOrg(ctx.orgId);
    const contact = await db.contact.findFirst({
      where: { id: ctx.contactId, organizationId: ctx.orgId, archivedAt: null },
      select: { profile: true, profileVersion: true },
    });
    if (!contact) throw new ProfileMergeFailed(`contact ${ctx.contactId} not found or archived`);
    const prev = parseProfile(contact.profile);
    if (prev?.entries.some((e) => e.conversationId === conversationId)) {
      return { status: "already", ai: true, contactId: ctx.contactId };
    }

    const request: ProfileMergeRequest = {
      profile: prev,
      chats: ctx.chats,
      incident: ctx.incident ?? undefined,
      org_tz: ctx.tz,
      bot: ctx.botName,
      channel: ctx.channel,
      conversation_id: conversationId,
      ended_at: ctx.endedAt.toISOString(),
    };

    let merged: VisitorProfile | null = null;
    let lastError = "";
    for (let attempt = 0; attempt <= this.retryDelaysMs.length && !merged; attempt++) {
      if (attempt > 0) await this.sleep(this.retryDelaysMs[attempt - 1]);
      try {
        let res = await this.ai.profileMerge(request);
        let check = checkMerged(prev, res?.profile, conversationId);
        // Over the size cap: ask once more with compression in the same attempt (R18.9).
        if (check.ok === false && check.tooBig) {
          res = await this.ai.profileMerge({ ...request, compress: true });
          check = checkMerged(prev, res?.profile, conversationId);
        }
        if (check.ok === true) merged = check.profile;
        else lastError = check.reason;
      } catch (error) {
        lastError = error?.message || String(error);
      }
      if (!merged) this.logger.warn(`Profile merge attempt ${attempt + 1} for ${conversationId} failed: ${lastError}`);
    }

    let ai = true;
    if (!merged) {
      if (!opts.allowFallback) throw new ProfileMergeFailed(lastError || "AI merge failed");
      ai = false;
      merged = insertEntry(
        prev,
        fallbackEntry({
          conversationId,
          at: ctx.endedAtLocal,
          tz: ctx.tz,
          bot: ctx.botName,
          channel: ctx.channel,
          messageCount: ctx.messageCount,
          incident: ctx.incident,
        }),
      );
    }

    const result = await this.write(ctx.orgId, ctx.contactId, contact.profileVersion, conversationId, merged, ai);
    return { ...result, contactId: ctx.contactId };
  }

  /** Compare-and-set the profile and record one `session_summary` Activity. */
  private async write(
    orgId: string,
    contactId: string,
    readVersion: number,
    conversationId: string,
    merged: VisitorProfile,
    ai: boolean,
  ): Promise<Omit<MergeOutcome, "contactId">> {
    const db = this.crm.forOrg(orgId);
    return db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ profile: unknown; profileVersion: number }[]>`
        SELECT "profile", "profileVersion" FROM "contact"
        WHERE "id" = ${contactId} AND "organizationId" = ${orgId} AND "archivedAt" IS NULL
        FOR UPDATE`;
      if (!rows.length) throw new ProfileMergeFailed(`contact ${contactId} disappeared`);
      let final = merged;
      if (Number(rows[0].profileVersion) !== Number(readVersion)) {
        const latest = parseProfile(rows[0].profile);
        if (latest?.entries.some((e) => e.conversationId === conversationId)) {
          return { status: "already" as const, ai };
        }
        final = rebase(latest, merged, conversationId);
      }
      const entry = final.entries.find((e) => e.conversationId === conversationId);
      await tx.contact.update({
        where: { id: contactId },
        data: {
          profile: final as unknown as Prisma.InputJsonValue,
          profileVersion: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });
      if (entry) {
        await tx.activity.create({
          data: {
            organizationId: orgId,
            type: ActivityType.NOTE,
            subject: ai ? "Chat summary" : "Chat summary (no AI)",
            body: entry.summary,
            contactId,
            createdById: CHAT_SYSTEM_USER,
            occurredAt: new Date(entry.at),
            meta: {
              kind: "session_summary",
              conversationId,
              at: entry.at,
              ai,
              ticketRef: entry.ticketRef ?? null,
              incidentId: entry.incidentId ?? null,
            },
          },
        });
      }
      this.contextCache.delete(conversationId);
      return { status: "merged" as const, ai, entry };
    });
  }

  /** Everything the merge needs from Mongo, masked (R11.5). */
  private async loadContext(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) throw new ProfileMergeFailed("bad conversation id");
    const Conversation = this.model("Conversation");
    const conv: any = await Conversation?.findById(conversationId)
      .select("bot visitor platform crmContactId createdAt updatedAt endedAt messageCount")
      .lean();
    if (!conv) throw new ProfileMergeFailed("conversation not found");
    const incident: any = await this.model("Incident")
      ?.findOne({ conversationId: String(conversationId) })
      .sort({ createdAt: -1 })
      .lean();
    const contactId: string | undefined = conv.crmContactId || incident?.crmContactId;
    if (!contactId) throw new ProfileMergeFailed("conversation has no CRM contact");
    const botId = conv.bot ? String(conv.bot) : incident?.botId;
    const orgId: string | null =
      (incident?.organizationId ? String(incident.organizationId) : null) ??
      (botId ? await this.tenantScope.orgIdForBot(botId).catch(() => null) : null);
    if (!orgId) throw new ProfileMergeFailed("organization not found");

    const [org, bot, rows, agent] = await Promise.all([
      this.model("Organization")?.findById(orgId).select("country timeZone").lean().catch(() => null),
      botId ? this.model("Bot")?.findById(botId).select("name").lean().catch(() => null) : null,
      this.model("Chat")
        ?.find({ conversationId })
        .sort({ time: -1, createdAt: -1, _id: -1 })
        .limit(MERGE_MAX_CHATS)
        .select("message sender type time createdAt direction secured")
        .lean(),
      incident?.agentId && Types.ObjectId.isValid(incident.agentId)
        ? this.model("Agent")?.findById(incident.agentId).select("name email").lean().catch(() => null)
        : null,
    ]);
    const visitorId = conv.visitor ? String(conv.visitor) : incident?.visitorId;
    const chats = ((rows as any[]) || [])
      .reverse()
      .map((c) => {
        const raw = typeof c.message === "string" ? c.message : "";
        // Secure answers never leave the backend, not even partly starred.
        const text = c.secured ? "[secure]" : maskPii(raw).slice(0, CHAT_TEXT_MAX);
        return {
          role: deriveSenderRole(c, { botId, visitorId }) ?? "system",
          text,
          at: new Date(c.time ?? c.createdAt ?? Date.now()).toISOString(),
        };
      })
      .filter((c) => c.text.trim());
    const tz = resolveOrgTimeZone(org as any);
    const endedAt = new Date(conv.endedAt ?? conv.updatedAt ?? Date.now());
    return {
      orgId,
      contactId: String(contactId),
      chats,
      tz,
      endedAt,
      endedAtLocal: localIso(endedAt, tz),
      botName: (bot as any)?.name,
      channel: conv.platform || "widget",
      messageCount: Math.max(Number(conv.messageCount) || 0, chats.length),
      incident: incident
        ? {
            id: String(incident._id),
            ticketRef: incident.ticketRef ?? undefined,
            problem: incident.problem ? maskPii(String(incident.problem)).slice(0, 300) : undefined,
            resolution: incident.resolutionNote ? maskPii(String(incident.resolutionNote)).slice(0, 500) : undefined,
            agent: ((agent as any)?.name || "").trim() || undefined,
            outcome: incident.outcome ?? undefined,
            status: incident.status,
          }
        : null,
    };
  }

  // ------------------------------------------------------ AI answer context

  /**
   * Facts and the 5 newest entries of the conversation's contact, for the AI
   * answer prompt (R18.8). Cached per conversation; null when there is no
   * contact or profile. Never throws.
   */
  async contextForConversation(conversationId: string): Promise<Record<string, unknown> | null> {
    if (!conversationId || !Types.ObjectId.isValid(conversationId)) return null;
    const hit = this.contextCache.get(conversationId);
    // "Nothing known" is re-checked sooner: a contact may be linked mid-chat.
    const ttl = hit?.value ? CONTEXT_TTL_MS : CONTEXT_EMPTY_TTL_MS;
    if (hit && Date.now() - hit.at < ttl) return hit.value;
    let value: Record<string, unknown> | null = null;
    try {
      const conv: any = await this.model("Conversation")?.findById(conversationId).select("bot visitor crmContactId").lean();
      // A returning visitor's first message can arrive before the new
      // conversation is linked (the link is fire-and-forget): use the
      // visitor's contact meanwhile.
      let contactId: string | undefined = conv?.crmContactId;
      if (!contactId && conv?.visitor && Types.ObjectId.isValid(String(conv.visitor))) {
        const v: any = await this.model("Visitor")?.findById(conv.visitor).select("crmContactId").lean();
        contactId = v?.crmContactId;
      }
      if (contactId && conv.bot) {
        const orgId = await this.tenantScope.orgIdForBot(String(conv.bot)).catch(() => null);
        if (orgId) {
          const c = await this.crm.forOrg(orgId).contact.findFirst({
            where: { id: String(contactId), organizationId: orgId, archivedAt: null },
            select: { profile: true },
          });
          value = profileForAi(parseProfile(c?.profile));
        }
      }
    } catch (error) {
      this.logger.warn(`Profile context for ${conversationId} failed: ${error?.message}`);
      return null; // not cached: try again next time
    }
    if (this.contextCache.size >= CONTEXT_CACHE_MAX) {
      const oldest = this.contextCache.keys().next().value;
      if (oldest) this.contextCache.delete(oldest);
    }
    this.contextCache.set(conversationId, { at: Date.now(), value });
    return value;
  }

  // ------------------------------------------------------ admin (R18.12)

  async getProfile(orgId: string, contactId: string) {
    const c = await this.crm.forOrg(orgId).contact.findFirst({
      where: { id: contactId, organizationId: orgId, archivedAt: null },
      select: { profile: true, profileVersion: true },
    });
    if (!c) throw new NotFoundException("Contact not found");
    return { profile: parseProfile(c.profile), version: c.profileVersion };
  }

  setFact(orgId: string, contactId: string, key: OverrideKey, value: unknown, actorId: string) {
    return this.edit(orgId, contactId, actorId, `fact:${key}`, (p) => setFactOverride(p, key, value));
  }

  clearFact(orgId: string, contactId: string, key: OverrideKey, actorId: string) {
    return this.edit(orgId, contactId, actorId, `fact_reset:${key}`, (p) => clearFactOverride(p, key));
  }

  removeEntry(orgId: string, contactId: string, key: string, actorId: string) {
    return this.edit(orgId, contactId, actorId, "entry_deleted", (p) => {
      const next = deleteEntry(p, key);
      if (!next) throw new NotFoundException("Profile entry not found");
      return next;
    });
  }

  /** Locked read-modify-write; bumps the version so in-flight merges rebase. */
  private async edit(
    orgId: string,
    contactId: string,
    actorId: string,
    what: string,
    change: (p: VisitorProfile | null) => VisitorProfile,
  ) {
    try {
      return await this.crm.forOrg(orgId).$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ profile: unknown; profileVersion: number }[]>`
          SELECT "profile", "profileVersion" FROM "contact"
          WHERE "id" = ${contactId} AND "organizationId" = ${orgId} AND "archivedAt" IS NULL
          FOR UPDATE`;
        if (!rows.length) throw new NotFoundException("Contact not found");
        const next = change(parseProfile(rows[0].profile));
        await tx.contact.update({
          where: { id: contactId },
          data: { profile: next as unknown as Prisma.InputJsonValue, profileVersion: { increment: 1 } },
        });
        // Audit trail of admin corrections on the contact timeline.
        await tx.activity.create({
          data: {
            organizationId: orgId,
            type: ActivityType.NOTE,
            subject: "Profile edited",
            body: what.startsWith("fact") ? `Changed ${what.split(":")[1]}` : "Deleted a profile entry",
            contactId,
            createdById: String(actorId || "unknown"),
            occurredAt: new Date(),
            meta: { kind: "profile_edit", what },
          },
        });
        this.contextCache.clear();
        return { profile: next, version: Number(rows[0].profileVersion) + 1 };
      });
    } catch (error) {
      if (error instanceof ProfileInvalidError) throw new NotFoundException(error.message);
      throw error;
    }
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}

/** ISO time with the zone's offset, e.g. 2026-10-09T15:35:00+05:30 (R18.3). */
export function localIso(d: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    const localAsUtc = Date.UTC(+get("year"), +get("month") - 1, +get("day"), +get("hour"), +get("minute"), +get("second"));
    const offsetMin = Math.round((localAsUtc - Math.floor(d.getTime() / 1000) * 1000) / 60_000);
    const sign = offsetMin >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMin);
    const off = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${off}`;
  } catch {
    return d.toISOString();
  }
}
