import { Inject, Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import mongoose, { Connection, Types } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { SocketStateService } from "src/socket/socket-state.service";
import { CaptureContext, CaptureResult, CrmBridgeService } from "./crm-bridge.service";
import { CleanDetails, cleanDetails, hasIdentifier, isPlaceholderEmail, phoneKey, RawDetails } from "./identity";

/** Where a visitor's details came from (crm-plugins-service-desk R1, R5). */
export type CaptureSource =
  | "widget_form"
  | "widget_chat"
  | "template"
  | "whatsapp"
  | "whatsapp_web"
  | "telegram"
  | "facebook"
  | "agent";

/** The visitor's stored name / email / phone changed (R4.4). */
export const VISITOR_DETAILS_UPDATED = "visitor.details.updated";

export interface VisitorDetailsUpdated {
  visitorId: string;
  conversationId: string;
  botId: string;
  name?: string;
  email?: string;
  phone?: string;
}

/** Capture source for an in-chat capture on a given platform. */
export function sourceForPlatform(platform?: string | null): CaptureSource {
  switch (platform) {
    case "whatsapp":
      return "whatsapp";
    case "whatsapp_web":
      return "whatsapp_web";
    case "telegram":
      return "telegram";
    case "facebook":
      return "facebook";
    default:
      return "widget_chat";
  }
}

/**
 * The one way visitor details enter the system (crm-plugins-service-desk R1).
 *
 * 1. Mongo first: the Visitor record follows the visitor's latest statement
 *    (R4.1), and the live conversation state takes the new name (R4.2).
 * 2. The dashboard is told when the shown name changed (R4.4).
 * 3. The CRM: find-or-create through the resolver when there is an email,
 *    phone or platform id; otherwise only name the linked contact (R1.6, D7).
 *
 * Never throws and never makes the visitor wait on the CRM: CRM failures are
 * queued by the bridge, and the Mongo updates still apply (R1.9).
 */
@Injectable()
export class ContactCaptureService {
  private readonly logger = new Logger(ContactCaptureService.name);

  constructor(
    private readonly bridge: CrmBridgeService,
    private readonly socketState: SocketStateService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
  ) {}

  async capture(
    ctx: CaptureContext,
    raw: RawDetails,
    source: CaptureSource,
    opts: { noConflictPrompt?: boolean } = {},
  ): Promise<CaptureResult | null> {
    if (ctx.mode === "preview") return null; // R1.10
    const details = cleanDetails(raw);
    try {
      await this.applyToVisitor(ctx, details);
    } catch (error) {
      this.logger.warn(`Visitor details update failed: ${error?.message}`);
    }
    try {
      if (hasIdentifier(details)) {
        return await this.bridge.capture(ctx, details, { ...opts, source });
      }
      if (details.name) await this.bridge.fillName(ctx, details.name, { weakName: details.weakName });
    } catch (error) {
      this.logger.warn(`CRM capture failed: ${error?.message}`);
    }
    return null;
  }

  /**
   * Write captured values to the Visitor (R4.1): a value replaces an empty
   * one, a placeholder ("Anonymous", `…@nomemail.com`, `0000000000`) or an
   * older one. Returns true when anything changed.
   */
  async applyToVisitor(ctx: CaptureContext, details: CleanDetails): Promise<boolean> {
    if (ctx.mode === "preview") return false;
    const Visitor = this.model("Visitor");
    if (!Visitor || !ctx.visitorId || !Types.ObjectId.isValid(ctx.visitorId)) return false;
    const v: any = await Visitor.findById(ctx.visitorId).select("name email phone").lean();
    if (!v) return false;

    const set: Record<string, string> = {};
    const storedName = (v.name ?? "").trim();
    // A stated name replaces the stored one; a guessed one only a blank or
    // "Anonymous" (D11).
    const namePlaceholder = !storedName || storedName.toLowerCase() === "anonymous";
    if (details.name && details.name !== storedName && (!details.weakName || namePlaceholder)) {
      set.name = details.name;
    }
    const storedEmail = typeof v.email === "string" ? v.email.trim().toLowerCase() : "";
    if (details.email && (details.email !== storedEmail || isPlaceholderEmail(storedEmail))) {
      set.email = details.email;
    }
    if (details.phone && phoneKey(details.phone) !== phoneKey(normalisedDigits(v.phone))) {
      set.phone = details.phone;
    }
    if (!Object.keys(set).length) return false;

    await Visitor.updateOne({ _id: ctx.visitorId }, { $set: set });

    if (set.name) {
      // Only the conversation this capture belongs to: a visitor who has
      // moved on to a new conversation keeps that one's state.
      const s = this.socketState.getUserData(String(ctx.visitorId));
      if (s && String(s.conversationId) === String(ctx.conversationId)) {
        this.socketState.updateUserData(String(ctx.visitorId), { visitorName: set.name, nameCaptured: true });
      }
    }
    const event: VisitorDetailsUpdated = {
      visitorId: String(ctx.visitorId),
      conversationId: String(ctx.conversationId),
      botId: String(ctx.botId),
      ...set,
    };
    this.eventEmitter.emit(VISITOR_DETAILS_UPDATED, event);
    return true;
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}

/** Stored visitor phones may be the "0000000000" placeholder: compare as digits. */
function normalisedDigits(phone: unknown): string | undefined {
  if (typeof phone !== "string" && typeof phone !== "number") return undefined;
  const d = String(phone).replace(/\D/g, "");
  return /^0+$/.test(d) ? undefined : d;
}
