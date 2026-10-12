import { BadRequestException, Inject, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { StageCategory } from "@prisma/client";
import mongoose, { Connection, Types } from "mongoose";
import { AiService } from "src/ai/ai.service";
import { maskPii } from "src/common/pii/mask";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { SR_DESCRIPTION_MAX, SR_SUBJECT_MAX, SrActor } from "./constants";
import { ServiceRequestTranscriptService } from "./service-request-transcript.service";
import { ServiceRequestRow, ServiceRequestsService } from "./service-requests.service";

/** Subjects the system writes when it knows nothing yet; the AI may replace them. */
export const PLACEHOLDER_SUBJECTS = new Set(
  [
    "Request for a specialist from chat",
    "Service request from chat",
    "Customer request",
    "Service request",
  ].map((s) => s.toLowerCase()),
);
/** A system-written subject, incl. "Customer request from <bot name>" (the TICKET node default). */
export function isPlaceholderSubject(subject: string): boolean {
  const s = subject.replace(/\s+/g, " ").trim().toLowerCase();
  return PLACEHOLDER_SUBJECTS.has(s) || /^(customer|service) request from\b/.test(s);
}
const SUBJECT_FROM_AI_MAX = 120;
const DRAFT_LINES = 200;

export interface WrapUpTarget {
  conversationId?: string;
  threadId?: string;
}

export interface WrapUpDraft {
  subject: string;
  description: string;
  priority: string;
  emergency: boolean;
  tags: string[];
}

export interface WrapUpView {
  conversationId: string;
  /** The chat's request, or null when the dialog will create one. */
  request: ServiceRequestRow | null;
  draft: WrapUpDraft;
  /** True when the AI wrote the draft; false = filled from what is stored. */
  ai: boolean;
  aiError: string | null;
}

export interface WrapUpInput extends WrapUpTarget {
  subject: string;
  description?: string | null;
  priority?: string;
  tags?: string[];
  emergency?: boolean;
  /** resolved: into the first Done stage (closes the incident). open: stays on the board. */
  outcome: "resolved" | "open";
  /** The agent checked the (AI-filled) details. Required. */
  confirmed: boolean;
}

/**
 * Wrap-up of a chat (owner request): before an agent closes or releases a
 * conversation, its service request must be filled in and confirmed. The
 * chat's open request is updated, never duplicated; a request is created
 * only when the chat has none. The AI prefills the form from the
 * conversation (masked like the summary, R15.4); the agent confirms it.
 */
@Injectable()
export class ServiceRequestWrapUpService {
  private readonly logger = new Logger(ServiceRequestWrapUpService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly requests: ServiceRequestsService,
    private readonly transcripts: ServiceRequestTranscriptService,
    private readonly tenantScope: TenantScopeService,
    @Optional() private readonly ai?: AiService,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  async view(orgId: string, target: WrapUpTarget): Promise<WrapUpView> {
    const conv = await this.conversation(orgId, target);
    const request = await this.requestFor(orgId, conv.id);
    const base: WrapUpDraft = {
      subject: request?.subject ?? "Customer request",
      description: request?.description ?? "",
      priority: request?.priority ?? "MEDIUM",
      emergency: request?.emergency ?? false,
      tags: request?.tags ?? [],
    };
    if (!this.ai) return { conversationId: conv.id, request, draft: base, ai: false, aiError: "The AI service is not configured." };
    try {
      const draft = await this.aiDraft(orgId, conv, request, base);
      return { conversationId: conv.id, request, draft, ai: true, aiError: null };
    } catch (error) {
      const reason = String(error?.response?.data?.detail ?? error?.message ?? error).slice(0, 300);
      this.logger.warn(`Wrap-up draft for ${conv.id} failed: ${reason}`);
      return { conversationId: conv.id, request, draft: base, ai: false, aiError: "The AI could not prefill this form. Please fill it in." };
    }
  }

  async save(orgId: string, actor: SrActor, input: WrapUpInput): Promise<ServiceRequestRow> {
    if (input?.confirmed !== true) throw new BadRequestException("Confirm that the details are correct before saving.");
    if (input.outcome !== "resolved" && input.outcome !== "open") throw new BadRequestException("Choose whether the request is resolved or stays open.");
    if (!String(input.subject ?? "").trim()) throw new BadRequestException("A service request needs a subject.");
    const conv = await this.conversation(orgId, input);
    const existing = await this.requestFor(orgId, conv.id);
    const fields = {
      subject: input.subject,
      description: input.description ?? null,
      priority: input.priority,
      tags: input.tags,
      emergency: input.emergency,
    };
    let row = existing
      ? await this.requests.update(orgId, actor, existing.id, fields)
      : await this.requests.create(orgId, actor, {
          ...fields,
          description: fields.description ?? undefined,
          botId: conv.botId,
          conversationId: conv.id,
          visitorId: conv.visitorId,
          assigneeId: actor.id ?? null,
        });
    // The agent who wraps it up owns an unowned request.
    if (!row.assigneeId && actor.id) row = await this.requests.assign(orgId, actor, row.id, actor.id);
    if (input.outcome === "resolved" && row.stage.category !== StageCategory.DONE) {
      row = await this.requests.moveToCategory(orgId, actor, row.id, "DONE");
    }
    return row;
  }

  // ------------------------------------------------------------------ helpers

  /** The conversation, by id or by its inbox thread; 404 unless it is this org's. */
  private async conversation(orgId: string, t: WrapUpTarget): Promise<{ id: string; botId: string | null; visitorId: string | null }> {
    const Conversation = this.model("Conversation");
    if (!Conversation) throw new NotFoundException("No such conversation.");
    let conv: any = null;
    if (t?.threadId && Types.ObjectId.isValid(String(t.threadId))) {
      conv = await Conversation.findOne({ channelThread: String(t.threadId) })
        .sort({ createdAt: -1 })
        .select("bot visitor")
        .lean();
    }
    if (!conv && t?.conversationId && Types.ObjectId.isValid(String(t.conversationId))) {
      conv = await Conversation.findById(String(t.conversationId)).select("bot visitor").lean();
    }
    if (!conv) throw new NotFoundException("No such conversation.");
    const botId = conv.bot ? String(conv.bot) : null;
    const owner = botId ? await this.tenantScope.orgIdForBot(botId).catch(() => null) : null;
    // Another org's conversation looks the same as a missing one (Property 7).
    if (owner !== orgId) throw new NotFoundException("No such conversation.");
    return { id: String(conv._id), botId, visitorId: conv.visitor ? String(conv.visitor) : null };
  }

  /** The chat's open request (the incident's first), else its newest one. */
  private async requestFor(orgId: string, conversationId: string): Promise<ServiceRequestRow | null> {
    const db = this.crm.forOrg(orgId);
    const where = { organizationId: orgId, conversationId };
    const open = await db.serviceRequest.findFirst({
      where: { ...where, stage: { category: { not: StageCategory.DONE } } },
      orderBy: [{ incidentId: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      select: { id: true },
    });
    const pick = open ?? (await db.serviceRequest.findFirst({ where, orderBy: { createdAt: "desc" }, select: { id: true } }));
    return pick ? this.requests.byId(orgId, pick.id) : null;
  }

  private async aiDraft(
    orgId: string,
    conv: { id: string; botId: string | null; visitorId: string | null },
    request: ServiceRequestRow | null,
    base: WrapUpDraft,
  ): Promise<WrapUpDraft> {
    const lines = request
      ? (await this.transcripts.forRequest(orgId, request.id)).lines
      : await this.transcripts.linesForConversation(conv.id, conv.botId, conv.visitorId);
    const contactId = request?.contactId ?? (await this.requests.contactOfConversation(orgId, conv.id, conv.visitorId));
    const contact = contactId
      ? await this.crm.forOrg(orgId).contact.findFirst({
          where: { id: contactId, organizationId: orgId },
          select: { firstName: true, lastName: true, email: true, phone: true },
        })
      : null;
    const secrets = [
      request?.ref,
      contact?.email,
      contact?.phone,
      ...[contact?.firstName, contact?.lastName].filter((n) => n && n.length >= 3 && !/^anonymous/i.test(n)),
    ].filter(Boolean) as string[];
    const mask = (s?: string | null) => (s ? maskPii(s, { secrets }).replace(/\bSR[_-][A-Za-z0-9_-]{4,}/gi, "[ref]") : "");
    const res = await this.ai!.serviceRequestSummary({
      subject: mask(base.subject) || "Customer request",
      description: mask(base.description) || null,
      transcript: lines
        .slice(-DRAFT_LINES)
        .map((l) => ({ from: l.from, text: mask(l.text) }))
        .filter((l) => l.text),
    });
    return {
      ...base,
      subject: draftSubject(base.subject, res.customer_ask || res.overview),
      description: draftDescription(res, base.description),
    };
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}

/** Keep a subject a person wrote; replace a system placeholder with the AI's ask. Pure. */
export function draftSubject(current: string | null | undefined, aiAsk: string | null | undefined): string {
  const cur = (current ?? "").replace(/\s+/g, " ").trim();
  if (cur && !isPlaceholderSubject(cur)) return cur.slice(0, SR_SUBJECT_MAX);
  const ask = (aiAsk ?? "").replace(/\s+/g, " ").trim();
  if (!ask) return cur || "Customer request";
  const sentence = ask.split(/(?<=[.!?])\s/)[0];
  return sentence.length <= SUBJECT_FROM_AI_MAX ? sentence : sentence.slice(0, SUBJECT_FROM_AI_MAX - 1).trimEnd() + "…";
}

/** The AI summary as the request's description, keeping what was recorded before. Pure. */
export function draftDescription(
  s: { overview?: string; customer_ask?: string; actions_taken?: string; next_step?: string },
  previous?: string | null,
): string {
  const parts = [
    s.overview?.trim(),
    [
      s.customer_ask?.trim() && `Customer wants: ${s.customer_ask.trim()}`,
      s.actions_taken?.trim() && `Done so far: ${s.actions_taken.trim()}`,
      s.next_step?.trim() && `Next step: ${s.next_step.trim()}`,
    ]
      .filter(Boolean)
      .join("\n"),
  ].filter(Boolean);
  const prev = (previous ?? "").trim();
  if (prev && !parts.join("\n").includes(prev)) parts.push(`Recorded from the chat:\n${prev}`);
  return parts.join("\n\n").slice(0, SR_DESCRIPTION_MAX);
}
