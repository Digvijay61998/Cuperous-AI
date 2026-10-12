import { Injectable, Logger, Optional } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { AiService } from "src/ai/ai.service";
import { SocketStateService } from "src/socket/socket-state.service";
import { CaptureSource, ContactCaptureService, sourceForPlatform } from "./contact-capture.service";
import {
  CleanDetails,
  cleanDetails,
  contactAliases,
  effectiveMapping,
  extractFromText,
  hasIdentifier,
  mayContainContact,
  readDetails,
} from "./identity";

export const ATTRIBUTE_CAPTURED = "attribute.captured";
export const VISITOR_TEXT = "visitor.text";
/**
 * MessageHandler asks the visitor which value to keep (R17.2). No longer
 * emitted: a different email/phone is now kept as history with the newest
 * one Current (crm-plugins-service-desk R21.2). Prompts already pending are
 * still settled by MessageHandler.
 */
export const IDENTITY_CONFLICT = "crm.identity.conflict";

/** Free text longer than this is not a self-introduction; skip extraction. */
const MAX_EXTRACT_TEXT = 2000;

/**
 * Turns chat events into contact captures (R2.1, R16.5;
 * crm-plugins-service-desk R1–R3). Runs off the visitor's path (async
 * listeners); every failure is swallowed or queued.
 */
@Injectable()
export class CrmBridgeListener {
  private readonly logger = new Logger(CrmBridgeListener.name);

  constructor(
    private readonly capture: ContactCaptureService,
    private readonly socketState: SocketStateService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly ai?: AiService,
  ) {}

  @OnEvent(ATTRIBUTE_CAPTURED, { async: true })
  async onAttributeCaptured(p: {
    userId: string;
    conversationId: string;
    botId: string;
    keys?: string[];
    source?: CaptureSource;
  }) {
    try {
      const s = this.socketState.getUserData(p.userId);
      if (!s || String(s.conversationId) !== String(p.conversationId)) return;
      // Only contact-detail aliases are worth a CRM round trip.
      const aliases = contactAliases(s.botSettings?.contactMapping);
      if (p.keys?.length && !p.keys.some((k) => aliases.has(k))) return;
      const raw = readDetails(s.attributes, s.botSettings?.contactMapping);
      await this.capture.capture(this.ctx(p.userId, s), raw, p.source ?? sourceForPlatform(s.platform));
    } catch (error) {
      this.logger.warn(`attribute capture failed: ${error?.message}`);
    }
  }

  /** Free-text "I'm Raj, raj@x.com" (R16.5). Needs an email or phone. */
  @OnEvent(VISITOR_TEXT, { async: true })
  async onVisitorText(p: { userId: string; text: string }) {
    try {
      const s = this.socketState.getUserData(p.userId);
      if (!s?.conversationId || s.mode === "preview") return;
      if (!mayContainContact(p.text) || p.text.length > MAX_EXTRACT_TEXT) return;
      const details = await this.extract(p.text);
      // A name guessed from free text alone is too unreliable to rename anyone.
      if (!hasIdentifier(details)) return;
      // Captured values also land on the attributes, so later questions for
      // them are skipped (R16.5 "no question SHALL be asked for them later").
      this.mergeAttributes(p.userId, details);
      // A name read out of free text is a guess: it never replaces a real one.
      await this.capture.capture(this.ctx(p.userId, s), { ...details, weakName: true }, sourceForPlatform(s.platform));
    } catch (error) {
      this.logger.warn(`free-text capture failed: ${error?.message}`);
    }
  }

  /** Regex first; the AI only when the regex result is ambiguous. */
  async extract(text: string): Promise<CleanDetails> {
    const rx = extractFromText(text);
    if (!rx.ambiguous || !this.ai) return cleanDetails(rx);
    try {
      const ai = await this.ai.extractContact(text);
      const fromAi = cleanDetails(ai ?? {});
      return { name: fromAi.name ?? rx.name, email: fromAi.email ?? rx.email, phone: fromAi.phone ?? rx.phone };
    } catch {
      return cleanDetails(rx);
    }
  }

  private mergeAttributes(userId: string, d: CleanDetails) {
    const s = this.socketState.getUserData(userId);
    if (!s) return;
    const map = effectiveMapping(s.botSettings?.contactMapping);
    const attrs = { ...(s.attributes || {}) };
    // Never overwrite something the flow already captured.
    if (d.name && map.name && !attrs[map.name]) attrs[map.name] = d.name;
    if (d.email && map.email && !attrs[map.email]) attrs[map.email] = d.email;
    if (d.phone && map.phone && !attrs[map.phone]) attrs[map.phone] = d.phone;
    this.socketState.updateUserData(userId, { attributes: attrs });
  }

  private ctx(userId: string, s: any) {
    return {
      conversationId: String(s.conversationId),
      visitorId: String(userId),
      botId: String(s.botId),
      botName: s.botName,
      channel: s.platform ?? "widget",
      mode: s.mode,
      botSettings: s.botSettings,
    };
  }
}
