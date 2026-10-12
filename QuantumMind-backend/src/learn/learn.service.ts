import { Inject, Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import mongoose, { Connection, Types } from "mongoose";
import { AiService } from "src/ai/ai.service";
import { isFeatureOn } from "src/common/features";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { CRM_OUTBOX_FAILED, CrmOutboxService } from "src/crm-outbox/crm-outbox.service";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { INCIDENT_CLOSED } from "src/incident/constants";
import { IncidentService } from "src/incident/incident.service";
import { QuestionStatusEnum } from "src/questions/enums/question-status.enum";
import { QUESTION_CHANGED, QUESTION_DELETED, QuestionsService } from "src/questions/questions.service";
import {
  checkCandidate,
  DEDUPE_THRESHOLD,
  KNOWLEDGE_SOURCE_PREFIX,
  knowledgeText,
  maskForLearning,
  Sensitive,
  shouldLearn,
} from "./learn-rules";

/** Emitted when no entry could be generated (R12.9): `{ incidentId, reason }`. */
export const INCIDENT_KNOWLEDGE_FAILED = "incident.knowledge.failed";
export const LEARN_OP_SYNC = "learn.sync";
export const LEARN_OP_REMOVE = "learn.remove";
/** Waits before the 2nd and 3rd generation attempt (3 attempts, R12.9). */
export const GENERATE_RETRY_DELAYS_MS = [30_000, 60_000];
const CONTACT_NAME_TIMEOUT_MS = 3000;

export type LearnResult = "skipped" | "busy" | "learned" | "merged" | "failed";

/**
 * Auto-learn from agent resolutions (crm-incident-handover R21, design §10).
 *
 * `incident.closed` with `resolved_by_agent` and a resolution note -> the AI
 * generalises it into a PII-free Q&A -> an approved Question Bank entry (or an
 * update of a near-duplicate) -> ingested as `incident:<id>` so the AI node
 * can use it from the next question. Behind the bot's `autoLearn` flag.
 *
 * Knowledge-base writes go through the CRM outbox on failure (retries at 1, 3
 * and 10 minutes); a permanent failure is shown on the entry (R12.8). Edits
 * and deletes in the Question Bank follow within the same budget (R21.4).
 */
@Injectable()
export class LearnService implements OnModuleInit {
  private readonly logger = new Logger(LearnService.name);
  /** Overridable in tests. */
  retryDelaysMs: readonly number[] = GENERATE_RETRY_DELAYS_MS;
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms));

  constructor(
    private readonly incidents: IncidentService,
    private readonly questions: QuestionsService,
    private readonly ai: AiService,
    private readonly outbox: CrmOutboxService,
    private readonly tenantScope: TenantScopeService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
    @Optional() private readonly crm?: CrmPrismaService,
  ) {}

  onModuleInit() {
    this.outbox.registerHandler(LEARN_OP_SYNC, async (p) => {
      await this.sync(String(p.questionId), { throwOnError: true });
    });
    this.outbox.registerHandler(LEARN_OP_REMOVE, async (p) => {
      await this.ai.removeKnowledgeSource(String(p.clientId), String(p.source));
    });
  }

  // ------------------------------------------------------------ learning

  @OnEvent(INCIDENT_CLOSED, { async: true })
  async onIncidentClosed(ev: { incidentId: string; outcome?: string; resolutionNote?: string; botId?: string }) {
    if (!ev?.incidentId || !shouldLearn(ev)) return;
    await this.learn(String(ev.incidentId), ev.botId ? String(ev.botId) : undefined).catch((e) =>
      this.logger.error(`Auto-learn for incident ${ev.incidentId} failed: ${e?.message}`),
    );
  }

  async learn(incidentId: string, botId?: string): Promise<LearnResult> {
    // Flag first: with auto-learn off the incident is left untouched (no
    // claim, no "skipped" mark), so nothing is recorded about the feature.
    if (botId && !(await this.flagOn(botId))) return "skipped";
    const claimed: any = await this.incidents.claimKnowledge(incidentId);
    if (!claimed) return "busy";
    try {
      return await this.learnClaimed(incidentId, claimed, botId);
    } catch (error) {
      // Never leave the claim hanging: nothing re-delivers the event.
      const reason = error?.message || String(error);
      await this.incidents.recordKnowledge(incidentId, { status: "failed", error: reason });
      this.eventEmitter.emit(INCIDENT_KNOWLEDGE_FAILED, { incidentId, reason });
      return "failed";
    }
  }

  private async learnClaimed(incidentId: string, claimed: any, botId?: string): Promise<LearnResult> {
    if (!shouldLearn(claimed) || (!botId && !(await this.flagOn(claimed.botId)))) {
      await this.incidents.recordKnowledge(incidentId, { status: "skipped" });
      return "skipped";
    }
    const orgId =
      (claimed.organizationId ? String(claimed.organizationId) : null) ??
      (await this.tenantScope.orgIdForBot(claimed.botId).catch(() => null));
    if (!orgId) {
      await this.incidents.recordKnowledge(incidentId, { status: "skipped", error: "no organization" });
      return "skipped";
    }

    const sensitive: Sensitive = {
      names: await this.contactNames(orgId, claimed.crmContactId),
      ticketRefs: [claimed.ticketRef],
    };
    const company = await this.botName(claimed.botId);

    let candidate: { question: string; answer: string } | null = null;
    let lastError = "";
    for (let attempt = 0; attempt <= this.retryDelaysMs.length && !candidate; attempt++) {
      if (attempt > 0) await this.sleep(this.retryDelaysMs[attempt - 1]);
      try {
        const res = await this.ai.knowledgeCandidate({
          problem: maskForLearning(claimed.problem, sensitive).slice(0, 1000),
          resolution: maskForLearning(claimed.resolutionNote, sensitive).slice(0, 2000),
          company,
        });
        const check = checkCandidate(res, sensitive);
        if (check.ok === true) candidate = { question: check.question, answer: check.answer };
        else lastError = check.reason;
      } catch (error) {
        lastError = error?.response?.data?.detail || error?.message || String(error);
      }
      if (!candidate) this.logger.warn(`Knowledge candidate attempt ${attempt + 1} for ${incidentId} failed: ${lastError}`);
    }
    if (!candidate) {
      await this.incidents.recordKnowledge(incidentId, { status: "failed", error: lastError });
      this.eventEmitter.emit(INCIDENT_KNOWLEDGE_FAILED, { incidentId, reason: lastError });
      return "failed";
    }

    const ref = { id: incidentId, ticketId: claimed.ticketId ? String(claimed.ticketId) : undefined, ticketRef: claimed.ticketRef };
    const clientId = String(claimed.botId);

    // R21.3: the same question, or a semantically close learned entry, is updated.
    let existing: any = await this.questions.findSameQuestion(orgId, candidate.question);
    if (existing && existing.source?.kind !== "incident") existing = null; // never touch a human entry
    if (!existing) {
      const similar = await this.ai
        .knowledgeSimilar({ client_id: clientId, text: knowledgeText(candidate.question, [candidate.answer]) })
        .catch((e) => {
          this.logger.warn(`Similarity check for ${incidentId} failed, adding a new entry: ${e?.message}`);
          return null;
        });
      const best = similar?.best;
      if (best && best.score >= DEDUPE_THRESHOLD && typeof best.source === "string" && best.source.startsWith(KNOWLEDGE_SOURCE_PREFIX)) {
        existing = await this.questions.findByKnowledgeSource(orgId, best.source);
      }
    }

    if (existing) {
      await this.questions.addIncidentToLearned(String(existing._id), ref, candidate.answer);
      await this.incidents.recordKnowledge(incidentId, { status: "merged", questionId: String(existing._id) });
      await this.sync(String(existing._id));
      return "merged";
    }

    const q = await this.questions.createLearned({
      organizationId: orgId,
      question: candidate.question,
      answer: candidate.answer,
      addedBy: claimed.agentId,
      source: {
        kind: "incident",
        incidentIds: [incidentId],
        incidents: [ref],
        clientId,
        knowledgeSource: `${KNOWLEDGE_SOURCE_PREFIX}${incidentId}`,
        ingest: { status: "pending", at: new Date() },
      },
    });
    await this.incidents.recordKnowledge(incidentId, { status: "learned", questionId: String(q._id) });
    await this.sync(String(q._id));
    return "learned";
  }

  // --------------------------------------------- knowledge-base mirroring

  /**
   * Make the knowledge base match the entry: approved -> ingested, anything
   * else -> removed (R12.4: an entry under review answers nobody). On a
   * failure the work is queued in the outbox; `throwOnError` is the outbox
   * handler's mode.
   */
  async sync(questionId: string, opts: { throwOnError?: boolean } = {}): Promise<void> {
    const q: any = await this.questions.findLearnedById(questionId);
    const src = q?.source;
    if (!q || src?.kind !== "incident" || !src.clientId || !src.knowledgeSource) return;
    const approved = q.status === QuestionStatusEnum.APPROVED;
    try {
      if (approved) {
        await this.ai.addKnowledge({
          clientId: src.clientId,
          botId: src.clientId,
          source: src.knowledgeSource,
          title: String(q.question).slice(0, 200),
          content: knowledgeText(q.question, q.answers),
        } as any);
      } else {
        await this.ai.removeKnowledgeSource(src.clientId, src.knowledgeSource);
      }
      await this.questions.setIngestState(questionId, { status: approved ? "ok" : "removed" });
    } catch (error) {
      const message = error?.message || String(error);
      if (opts.throwOnError) throw error;
      this.logger.warn(`Knowledge sync for question ${questionId} failed, queued: ${message}`);
      await this.questions.setIngestState(questionId, { status: "pending", error: message });
      await this.outbox.enqueue(LEARN_OP_SYNC, { questionId }, {
        organizationId: q.organizationId ? String(q.organizationId) : undefined,
        dedupeKey: `learn:${questionId}`,
        lastError: message,
      });
    }
  }

  /** R21.4: an edit or a status change re-syncs the knowledge base. */
  @OnEvent(QUESTION_CHANGED, { async: true })
  async onQuestionChanged(p: { questionId: string }) {
    if (p?.questionId) await this.sync(String(p.questionId)).catch((e) => this.logger.warn(`Sync failed: ${e?.message}`));
  }

  /** R21.4: a deleted learned entry leaves the knowledge base too. */
  @OnEvent(QUESTION_DELETED, { async: true })
  async onQuestionDeleted(p: { questionId: string; source?: any }) {
    const { clientId, knowledgeSource } = p?.source || {};
    if (!clientId || !knowledgeSource) return;
    try {
      await this.ai.removeKnowledgeSource(String(clientId), String(knowledgeSource));
    } catch (error) {
      await this.outbox.enqueue(LEARN_OP_REMOVE, { clientId: String(clientId), source: String(knowledgeSource) }, {
        dedupeKey: `learn-remove:${clientId}:${knowledgeSource}`,
        lastError: error?.message,
      });
    }
  }

  /** R12.8: after the last retry the entry shows an ingestion failure. */
  @OnEvent(CRM_OUTBOX_FAILED, { async: true })
  async onOutboxFailed(p: { op: string; payload: any; error: string }) {
    if (p?.op === LEARN_OP_SYNC && p.payload?.questionId) {
      await this.questions.setIngestState(String(p.payload.questionId), { status: "failed", error: p.error });
    } else if (p?.op === LEARN_OP_REMOVE) {
      this.logger.error(`Learned knowledge source ${p.payload?.source} could not be removed: ${p.error}`);
    }
  }

  // ------------------------------------------------------------- helpers

  private async contactNames(orgId: string, contactId?: string): Promise<string[]> {
    if (!contactId || !this.crm) return [];
    let timer: NodeJS.Timeout;
    const c: any = await Promise.race([
      this.crm
        .forOrg(orgId)
        .contact.findFirst({ where: { id: String(contactId), organizationId: orgId }, select: { firstName: true, lastName: true } })
        .catch(() => null),
      new Promise((r) => {
        timer = setTimeout(() => r(null), CONTACT_NAME_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));
    return [c?.firstName, c?.lastName].filter(Boolean);
  }

  private async botName(botId: string): Promise<string | undefined> {
    if (!Types.ObjectId.isValid(botId)) return undefined;
    const bot: any = await this.model("Bot")?.findById(botId).select("name").lean().catch(() => null);
    return typeof bot?.name === "string" ? bot.name.slice(0, 100) : undefined;
  }

  private async flagOn(botId: string): Promise<boolean> {
    if (!botId || !Types.ObjectId.isValid(botId)) return false;
    const bot: any = await this.model("Bot")?.findById(botId).select("botSetting").lean().catch(() => null);
    if (!bot?.botSetting) return false;
    const s: any = await this.model("BotSetting")?.findById(bot.botSetting).select("features").lean().catch(() => null);
    return isFeatureOn(s, "autoLearn");
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}
