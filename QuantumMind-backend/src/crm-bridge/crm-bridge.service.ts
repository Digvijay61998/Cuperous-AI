import { Inject, Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { ServiceRequestsService } from "src/crm/service-requests/service-requests.service";
import { SR_NEEDS_CONTACT, SrNeedsContactEvent } from "src/crm/service-requests/constants";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import mongoose, { Connection, Types } from "mongoose";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { CrmOutboxService } from "src/crm-outbox/crm-outbox.service";
import { CleanDetails, cleanDetails, ContactMapping, hasIdentifier, readDetails } from "./identity";
import { ContactResolverService, ResolveOutcome } from "./contact-resolver.service";

export const CRM_OP_RESOLVE = "contact.resolve";
export const CRM_OP_LINK = "contact.link";
export const CRM_OP_ANON = "contact.anonymous";

/** Emitted once a conversation is linked to a CRM contact. */
export const CRM_CONTACT_LINKED = "crm.contact.linked";

export interface CaptureContext {
  conversationId: string;
  visitorId?: string;
  botId: string;
  botName?: string;
  channel?: string;
  mode?: string;
  botSettings?: { features?: any; contactMapping?: ContactMapping } | null;
}

export interface CaptureResult {
  outcome: ResolveOutcome;
  /** Contact now linked to the conversation (existing link wins, R3.7). */
  contactId?: string;
}

const isPreview = (mode?: string) => mode === "preview";

/**
 * Glue between the Mongo chat world and the CRM (design §2).
 *
 * - Visitor-facing callers never wait on the CRM for success: every CRM
 *   failure is parked in the outbox (R2.8, R3.9), and this never throws.
 * - Links are org-scoped (R3.6): the org always comes from the bot.
 * - An existing different link on the conversation is kept (R3.7).
 */
@Injectable()
export class CrmBridgeService implements OnModuleInit {
  private readonly logger = new Logger(CrmBridgeService.name);

  constructor(
    private readonly resolver: ContactResolverService,
    private readonly outbox: CrmOutboxService,
    private readonly tenantScope: TenantScopeService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
    // Service Requests follow the conversation's contact (crm-plugins-service-desk R9.6).
    @Optional() private readonly serviceRequests?: ServiceRequestsService,
  ) {}

  onModuleInit() {
    this.outbox.registerHandler(CRM_OP_RESOLVE, async (p) => {
      await this.resolveAndLink(p.orgId, p.ctx, p.details, { throwOnError: true, source: p.source });
    });
    this.outbox.registerHandler(CRM_OP_LINK, async (p) => {
      await this.resolver.recordLink(p.orgId, p.contactId, p.link);
    });
    this.outbox.registerHandler(CRM_OP_ANON, async (p) => {
      await this.ensureAnonymous(p.ctx, { throwOnError: true });
    });
  }

  /**
   * Captured attributes changed: resolve the contact if they carry an
   * identifier (R2.1). Always on except in preview (crm-plugins-service-desk R2).
   */
  async captureFromAttributes(
    ctx: CaptureContext,
    attributes: Record<string, unknown> | undefined,
  ): Promise<CaptureResult | null> {
    if (isPreview(ctx.mode)) return null;
    const details = cleanDetails(readDetails(attributes, ctx.botSettings?.contactMapping));
    return this.capture(ctx, details);
  }

  /** Same as above for details already parsed (free text, agent form, channels). */
  async capture(
    ctx: CaptureContext,
    details: CleanDetails,
    opts: { noConflictPrompt?: boolean; source?: string } = {},
  ) {
    if (isPreview(ctx.mode) || !hasIdentifier(details)) return null; // R2.6
    const orgId = await this.orgId(ctx.botId);
    if (!orgId) return null;
    return this.resolveAndLink(orgId, ctx, details, opts);
  }

  /**
   * Name without an identifier (R1.6, D7): only names the contact this
   * conversation is already linked to. Never creates one. Never throws.
   */
  async fillName(ctx: CaptureContext, name: string, opts: { weakName?: boolean } = {}): Promise<boolean> {
    try {
      if (isPreview(ctx.mode) || !name) return false;
      const contactId = await this.linkedContactId(ctx.conversationId);
      if (!contactId) return false;
      const orgId = await this.orgId(ctx.botId);
      if (!orgId) return false;
      const changed = await this.resolver.fillName(orgId, contactId, name, opts);
      if (changed) this.touchRequests(orgId, contactId);
      return changed;
    } catch (error) {
      this.logger.warn(`Contact name fill failed: ${error?.message}`);
      return false;
    }
  }

  /**
   * R20.1: handover with no identifiers creates an anonymous contact so the
   * incident and ticket have someone to point at. Returns the linked contact id.
   */
  async ensureAnonymous(ctx: CaptureContext, opts: { throwOnError?: boolean } = {}): Promise<string | null> {
    if (isPreview(ctx.mode)) return null;
    // Only from openForHandover (R20.4: no contact for anonymous chats
    // without an incident). Not flag-gated any more (crm-plugins-service-desk R2.4).
    const orgId = await this.orgId(ctx.botId);
    if (!orgId) return null;
    const existing = await this.linkedContactId(ctx.conversationId);
    if (existing) return existing;
    try {
      const contactId = await this.resolver.createAnonymous(orgId, String(ctx.conversationId), ctx.visitorId);
      return await this.link(orgId, ctx, contactId);
    } catch (error) {
      if (opts.throwOnError) throw error;
      this.logger.warn(`Anonymous contact failed, queued: ${error?.message}`);
      await this.outbox.enqueue(CRM_OP_ANON, { ctx: this.slim(ctx) }, {
        organizationId: orgId,
        dedupeKey: `anon:${ctx.conversationId}`,
        lastError: error?.message,
      });
      return null;
    }
  }

  /**
   * A known visitor started a new conversation (R16.4, R18.8): it belongs to
   * the same contact, so the profile reaches the AI and the chat is summarised
   * into the profile when it ends. Found in Phase 9: without this link the new
   * conversation had no contact, so the AI never saw the profile and the
   * session lifecycle purged the chat without summarising it.
   *
   * Only the visitor's own stored id is used, never a host-page identity
   * (D10). An archived (merged-away) contact is not re-linked. Never throws.
   */
  async linkReturning(ctx: CaptureContext): Promise<string | null> {
    try {
      if (isPreview(ctx.mode)) return null;
      if (!ctx.visitorId) return null;
      const contactId = await this.visitorContactId(ctx.visitorId);
      if (!contactId) return null;
      const orgId = await this.orgId(ctx.botId);
      if (!orgId) return null;
      if (!(await this.resolver.summary(orgId, contactId))) return null;
      return await this.link(orgId, ctx, contactId);
    } catch (error) {
      this.logger.warn(`Returning-visitor link failed: ${error?.message}`);
      return null;
    }
  }

  /** Contact linked to a conversation, if any. */
  async linkedContactId(conversationId: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const conv: any = await this.model("Conversation")
      ?.findById(conversationId)
      .select("crmContactId")
      .lean()
      .catch(() => null);
    return conv?.crmContactId ?? null;
  }

  /** Contact linked to a visitor (returning visitor, R16.4). */
  async visitorContactId(visitorId: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(visitorId)) return null;
    const v: any = await this.model("Visitor")
      ?.findById(visitorId)
      .select("crmContactId")
      .lean()
      .catch(() => null);
    return v?.crmContactId ?? null;
  }

  // ---------------------------------------------------------- internals

  private async resolveAndLink(
    orgId: string,
    ctx: CaptureContext,
    details: CleanDetails,
    opts: { throwOnError?: boolean; noConflictPrompt?: boolean; source?: string } = {},
  ): Promise<CaptureResult | null> {
    try {
      const currentContactId = (await this.linkedContactId(ctx.conversationId)) ?? undefined;
      const outcome = await this.resolver.resolve(orgId, {
        details,
        currentContactId,
        noConflictPrompt: opts.noConflictPrompt,
        source: opts.source,
      });
      if (outcome.kind === "none") return { outcome };
      // Only a merged-away anonymous link may be replaced; any other existing
      // link to a different contact stays (R3.7).
      const merged = outcome.kind === "linked" && outcome.merged === true;
      const contactId = await this.link(orgId, ctx, outcome.contactId, merged ? currentContactId : undefined);
      if (outcome.kind === "linked" && outcome.merged && currentContactId && currentContactId !== outcome.contactId) {
        await this.repointMongo(currentContactId, outcome.contactId, orgId);
      }
      // The contact's name/email/phone may have changed in place (an
      // anonymous contact upgraded): the cards that show it are pushed again.
      this.touchRequests(orgId, outcome.contactId);
      return { outcome, contactId: contactId ?? undefined };
    } catch (error) {
      if (opts.throwOnError) throw error;
      this.logger.warn(`CRM resolve failed, queued for retry: ${error?.message}`);
      await this.outbox.enqueue(
        CRM_OP_RESOLVE,
        { orgId, ctx: this.slim(ctx), details, source: opts.source },
        {
          organizationId: orgId,
          // One pending resolve per conversation+identifiers.
          dedupeKey: `resolve:${ctx.conversationId}:${details.email ?? ""}:${details.phone ?? ""}:${details.channel?.value ?? ""}`,
          lastError: error?.message,
        },
      );
      return null;
    }
  }

  /**
   * Store the link on Visitor and Conversation (R3.1). Only fills an empty
   * link, or replaces a link to an anonymous contact that was just merged.
   * Returns the contact id the conversation ends up linked to.
   */
  private async link(
    orgId: string,
    ctx: CaptureContext,
    contactId: string,
    replaceableId?: string,
  ): Promise<string | null> {
    const Conversation = this.model("Conversation");
    const Visitor = this.model("Visitor");
    if (!Conversation || !Types.ObjectId.isValid(ctx.conversationId)) return null;

    const updated: any = await Conversation.findOneAndUpdate(
      {
        _id: ctx.conversationId,
        $or: [
          { crmContactId: { $exists: false } },
          { crmContactId: null },
          { crmContactId: contactId },
          ...(replaceableId ? [{ crmContactId: replaceableId }] : []),
        ],
      },
      { $set: { crmContactId: contactId } },
      { new: true },
    )
      .select("crmContactId")
      .lean();
    if (!updated) {
      // Linked to someone else already: keep it, no Activity (R3.7).
      return this.linkedContactId(ctx.conversationId);
    }

    if (Visitor && ctx.visitorId && Types.ObjectId.isValid(ctx.visitorId)) {
      await Visitor.updateOne(
        {
          _id: ctx.visitorId,
          $or: [
            { crmContactId: { $exists: false } },
            { crmContactId: null },
            ...(replaceableId ? [{ crmContactId: replaceableId }] : []),
          ],
        },
        { $set: { crmContactId: contactId } },
      ).catch(() => undefined);
    }

    // Incident and ticket of this conversation point at the contact too (R1.10, R4.2).
    await this.model("Incident")
      ?.updateMany(
        { conversationId: String(ctx.conversationId), $or: [{ crmContactId: null }, { crmContactId: { $exists: false } }, ...(replaceableId ? [{ crmContactId: replaceableId }] : [])] },
        { $set: { crmContactId: contactId } },
      )
      .catch(() => undefined);
    // Service Requests live in the CRM now (crm-plugins-service-desk R9.6).
    await this.serviceRequests
      ?.linkContactForConversation(orgId, String(ctx.conversationId), contactId, replaceableId)
      .catch((e) => this.logger.warn(`Service request contact link failed: ${e?.message}`));

    const linkPayload = {
      conversationId: String(ctx.conversationId),
      visitorId: ctx.visitorId ? String(ctx.visitorId) : undefined,
      botName: ctx.botName,
      channel: ctx.channel ?? "widget",
      at: new Date(),
    };
    await this.outbox.runOrEnqueue(
      CRM_OP_LINK,
      { orgId, contactId, link: linkPayload },
      () => this.resolver.recordLink(orgId, contactId, linkPayload),
      { organizationId: orgId, dedupeKey: `link:${ctx.conversationId}:${contactId}` },
    );

    this.eventEmitter.emit(CRM_CONTACT_LINKED, {
      organizationId: orgId,
      conversationId: String(ctx.conversationId),
      visitorId: ctx.visitorId,
      contactId,
    });
    return contactId;
  }

  /** After an anonymous merge, every Mongo row and service request points at the survivor (R20.3). */
  private async repointMongo(fromId: string, toId: string, orgId?: string) {
    if (orgId && this.serviceRequests) {
      await this.serviceRequests
        .repointContact(orgId, fromId, toId)
        .catch((e: any) => this.logger.warn(`Repoint service requests failed: ${e?.message}`));
    }
    for (const name of ["Visitor", "Conversation", "Incident"]) {
      await this.model(name)
        ?.updateMany({ crmContactId: fromId }, { $set: { crmContactId: toId } })
        .catch((e: any) => this.logger.warn(`Repoint ${name} failed: ${e?.message}`));
    }
  }

  private async orgId(botId: string): Promise<string | null> {
    return this.tenantScope.orgIdForBot(botId).catch(() => null);
  }

  /** Best effort: push the contact's request cards (no await on the chat path). */
  touchRequests(orgId: string, contactId?: string | null) {
    if (!contactId || !this.serviceRequests) return;
    // Never throws, not even synchronously: a refresh must not turn a
    // successful link into a queued retry.
    const srs = this.serviceRequests;
    void Promise.resolve()
      .then(() => srs.touchContact(orgId, String(contactId)))
      .catch((e: any) => this.logger.warn(`Service request refresh failed: ${e?.message}`));
  }

  /**
   * A request was raised for a chat with no CRM contact yet (typically the
   * agent's "Create ticket" before the visitor gave details through a
   * captured question). Use what the Visitor record already knows: an email
   * or phone finds or creates the real contact; otherwise an anonymous one
   * named after the visitor, as for a handover (R20.1). Linking the
   * conversation links all its requests. Never throws.
   */
  @OnEvent(SR_NEEDS_CONTACT, { async: true })
  async onRequestNeedsContact(e: SrNeedsContactEvent) {
    try {
      if (!e?.conversationId || !Types.ObjectId.isValid(String(e.conversationId))) return;
      const conv: any = await this.model("Conversation")
        ?.findById(String(e.conversationId))
        .select("bot visitor platform crmContactId")
        .lean();
      const botId = String(e.botId || conv?.bot || "");
      if (!botId) return;
      const visitorId = e.visitorId || (conv?.visitor ? String(conv.visitor) : undefined);
      const ctx: CaptureContext = {
        conversationId: String(e.conversationId),
        visitorId: visitorId ? String(visitorId) : undefined,
        botId,
        channel: conv?.platform,
      };
      // Linked meanwhile (a capture ran): just make sure the requests follow.
      if (conv?.crmContactId) {
        await this.serviceRequests?.linkContactForConversation(e.orgId, ctx.conversationId, String(conv.crmContactId));
        return;
      }
      const v: any =
        visitorId && Types.ObjectId.isValid(String(visitorId))
          ? await this.model("Visitor")?.findById(String(visitorId)).select("name email phone").lean()
          : null;
      const details = cleanDetails({ name: v?.name, email: v?.email, phone: v?.phone });
      if (hasIdentifier(details)) {
        await this.resolveAndLink(e.orgId, ctx, details, { source: "agent" });
        return;
      }
      const contactId = await this.ensureAnonymous(ctx);
      if (contactId && details.name) await this.fillName(ctx, details.name, { weakName: true });
    } catch (error) {
      this.logger.warn(`Contact for service request ${e?.id} failed: ${error?.message}`);
    }
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }

  /** Only what the outbox handler needs (no botSettings blob). */
  private slim(ctx: CaptureContext): CaptureContext {
    return {
      conversationId: String(ctx.conversationId),
      visitorId: ctx.visitorId ? String(ctx.visitorId) : undefined,
      botId: String(ctx.botId),
      botName: ctx.botName,
      channel: ctx.channel,
    };
  }
}
