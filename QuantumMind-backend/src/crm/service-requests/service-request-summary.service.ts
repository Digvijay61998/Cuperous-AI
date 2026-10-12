import { Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Prisma, ServiceRequestEventType } from "@prisma/client";
import { AiService } from "src/ai/ai.service";
import { maskPii } from "src/common/pii/mask";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { SR_CHANGED, SrActor, SrChangedEvent, SYSTEM_ACTOR } from "./constants";
import { ServiceRequestTranscriptService } from "./service-request-transcript.service";

/** Lines sent to the AI (newest kept). */
const SUMMARY_LINES = 200;
/** Wait before the one retry. */
export const SUMMARY_RETRY_MS = 60_000;

export interface SrSummary {
  overview: string;
  customerAsk: string;
  actionsTaken: string;
  nextStep: string;
  generatedAt: string;
  ai: true;
}

/**
 * AI summary of a request (crm-plugins-service-desk R15).
 *
 * Generated in the background when a request is created and when it closes
 * (never awaited by the chat), and on demand from the drawer. Input is
 * masked (R15.4): the contact's own name, email and phone and every SR_
 * reference are removed before anything leaves the backend. A failure keeps
 * the previous summary and records `summaryError` (R15.5). One job per
 * request at a time.
 */
@Injectable()
export class ServiceRequestSummaryService {
  private readonly logger = new Logger(ServiceRequestSummaryService.name);
  private readonly running = new Set<string>();
  /** Overridable in tests. */
  retryDelayMs = SUMMARY_RETRY_MS;

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly transcripts: ServiceRequestTranscriptService,
    @Optional() private readonly ai?: AiService,
  ) {}

  @OnEvent(SR_CHANGED, { async: true })
  async onChanged(e: SrChangedEvent) {
    if (e.kind !== "created" && !e.closed) return;
    void this.generate(e.orgId, e.id, SYSTEM_ACTOR, { retry: true });
  }

  /** From the drawer (R15.3): waits for the result and returns the request's summary state. */
  async regenerate(orgId: string, id: string, actor: SrActor) {
    const exists = await this.crm.forOrg(orgId).serviceRequest.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!exists) throw new NotFoundException("No such service request.");
    await this.generate(orgId, id, actor, { retry: false });
    const row = await this.crm.forOrg(orgId).serviceRequest.findFirst({
      where: { id, organizationId: orgId },
      select: { summary: true, summaryError: true },
    });
    return { summary: row?.summary ?? null, summaryError: row?.summaryError ?? null };
  }

  /** Never throws. Returns true when a new summary was stored. */
  async generate(orgId: string, id: string, actor: SrActor, opts: { retry: boolean }): Promise<boolean> {
    if (!this.ai) return false;
    if (this.running.has(id)) return false;
    this.running.add(id);
    try {
      const attempts = opts.retry ? 2 : 1;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          await this.once(orgId, id, actor);
          return true;
        } catch (error) {
          const reason = String(error?.response?.data?.detail ?? error?.message ?? error).slice(0, 300);
          this.logger.warn(`Summary of ${id} failed (${attempt}/${attempts}): ${reason}`);
          await this.crm
            .forOrg(orgId)
            .serviceRequest.updateMany({ where: { id, organizationId: orgId }, data: { summaryError: reason } })
            .catch(() => undefined);
          if (attempt < attempts) await sleep(this.retryDelayMs);
        }
      }
      return false;
    } finally {
      this.running.delete(id);
    }
  }

  private async once(orgId: string, id: string, actor: SrActor) {
    const db = this.crm.forOrg(orgId);
    const sr = await db.serviceRequest.findFirst({
      where: { id, organizationId: orgId },
      select: {
        ref: true,
        subject: true,
        description: true,
        contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!sr) throw new NotFoundException("No such service request.");
    const t = await this.transcripts.forRequest(orgId, id);
    const secrets = [
      sr.ref,
      sr.contact?.email,
      sr.contact?.phone,
      ...[sr.contact?.firstName, sr.contact?.lastName].filter((n) => n && n.length >= 3 && !/^anonymous/i.test(n)),
    ].filter(Boolean) as string[];
    const mask = (s?: string | null) => (s ? maskPii(s, { secrets }).replace(/\bSR[_-][A-Za-z0-9_-]{4,}/gi, "[ref]") : s);
    const res = await this.ai!.serviceRequestSummary({
      subject: mask(sr.subject) || "Service request",
      description: mask(sr.description) ?? null,
      transcript: t.lines
        .slice(-SUMMARY_LINES)
        .map((l) => ({ from: l.from, text: mask(l.text) || "" }))
        .filter((l) => l.text),
    });
    const summary: SrSummary = {
      overview: res.overview,
      customerAsk: res.customer_ask,
      actionsTaken: res.actions_taken,
      nextStep: res.next_step,
      generatedAt: new Date().toISOString(),
      ai: true,
    };
    await db.$transaction([
      db.serviceRequest.update({
        where: { id },
        data: { summary: summary as unknown as Prisma.InputJsonValue, summaryError: null },
      }),
      db.serviceRequestEvent.create({
        data: {
          organizationId: orgId,
          serviceRequestId: id,
          type: ServiceRequestEventType.SUMMARY_GENERATED,
          actorId: actor.id ?? null,
          actorName: actor.name ?? null,
        },
      }),
    ]);
  }
}

const sleep = (ms: number) =>
  new Promise<void>((r) => {
    const t = setTimeout(r, ms);
    (t as any).unref?.();
  });
