import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { CONVERSATION_ENDED } from "src/handover-alert/constants";
import { ConversationEndCause, TICKET_RESOLVED } from "./constants";
import { IncidentService } from "./incident.service";

const CAUSES: ReadonlySet<string> = new Set([
  "close_chat",
  "expired",
  "disconnect",
  "agent_release",
  "ended",
  "closure_resolved",
  "idle",
]);

/** Decoupled lifecycle hooks, so emitters never import this module. */
@Injectable()
export class IncidentListener {
  private readonly logger = new Logger(IncidentListener.name);

  constructor(private readonly incidentService: IncidentService) {}

  @OnEvent(CONVERSATION_ENDED, { async: true })
  async onConversationEnded(payload: { conversationId: string; cause?: string }) {
    try {
      if (!payload?.conversationId) return;
      const cause = (CAUSES.has(payload.cause ?? "") ? payload.cause : "ended") as ConversationEndCause;
      await this.incidentService.closeOnConversationEnd(String(payload.conversationId), cause);
    } catch (error) {
      this.logger.error(`Incident close on conversation end failed: ${error?.message}`);
    }
  }

  /** R7.3: record admin overrides on the open incident. */
  @OnEvent("inbox.ownership.overridden", { async: true })
  async onOwnershipOverridden(p: { conversationId?: string; from: string | null; to: string; actor: string; at: Date }) {
    try {
      if (!p?.conversationId) return;
      await this.incidentService.recordOverride(p.conversationId, p);
    } catch (error) {
      this.logger.error(`Override record failed: ${error?.message}`);
    }
  }

  @OnEvent(TICKET_RESOLVED, { async: true })
  async onTicketResolved(payload: { ticketId: string; incident?: string; userId?: string }) {
    try {
      await this.incidentService.onTicketResolved(payload, payload?.userId);
    } catch (error) {
      this.logger.error(`Incident resolve from ticket failed: ${error?.message}`);
    }
  }
}
