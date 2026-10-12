import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { ContactCaptureService } from "./contact-capture.service";
import { STATUS_FOR_CATEGORY, StageCategoryKey } from "src/crm/service-requests/stage-rules";
import mongoose, { Connection, Types } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { CrmBridgeService } from "./crm-bridge.service";
import { cleanDetails, hasIdentifier } from "./identity";
import { ContactResolverService } from "./contact-resolver.service";

const PAGE_MAX = 50;

/**
 * Read side of the chat <-> CRM links for the dashboard (R3.3, R3.4, R3.6,
 * R3.8, R20.2). Mongo rows carry a bot, not an org, so every query is pinned
 * to the org's bots; another org's rows are never returned.
 */
@Injectable()
export class CrmLinksService {
  constructor(
    private readonly crm: CrmPrismaService,
    private readonly bridge: CrmBridgeService,
    private readonly resolver: ContactResolverService,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
    @Optional() private readonly capture?: ContactCaptureService,
  ) {}

  async listLinks(
    orgId: string,
    contactId: string,
    kind: "conversations" | "incidents" | "tickets",
    skip = 0,
    limit = PAGE_MAX,
  ) {
    const contact = await this.crm.forOrg(orgId).contact.findFirst({
      where: { id: contactId, organizationId: orgId },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException("No such contact.");

    const take = Math.min(PAGE_MAX, Math.max(1, limit));
    const from = Math.max(0, skip);
    const botIds = await this.orgBotIds(orgId);

    if (kind === "incidents") {
      const filter = { crmContactId: contactId, organizationId: new Types.ObjectId(orgId) };
      const M = this.model("Incident");
      if (!M) return { data: [], count: 0 };
      const [data, count] = await Promise.all([
        M.find(filter)
          .sort({ createdAt: -1 })
          .skip(from)
          .limit(take)
          .select("createdAt status outcome conversationId ticketRef problem")
          .lean(),
        M.countDocuments(filter),
      ]);
      return { data, count };
    }

    if (kind === "tickets") {
      // Service Requests live in the CRM (crm-plugins-service-desk R19.4, R20).
      const db = this.crm.forOrg(orgId);
      const where = { organizationId: orgId, contactId };
      const [rows, count] = await Promise.all([
        db.serviceRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: from,
          take,
          select: {
            id: true,
            ref: true,
            subject: true,
            createdAt: true,
            assigneeName: true,
            stage: { select: { name: true, category: true, color: true } },
          },
        }),
        db.serviceRequest.count({ where }),
      ]);
      const data = rows.map((r) => ({
        _id: r.id,
        id: r.id,
        ticketId: r.ref,
        subject: r.subject,
        status: STATUS_FOR_CATEGORY[r.stage.category as StageCategoryKey] ?? "OPEN",
        stage: r.stage,
        assigneeName: r.assigneeName,
        createdAt: r.createdAt,
      }));
      return { data, count };
    }

    const filter = { crmContactId: contactId, bot: { $in: botIds } };
    const M = this.model("Conversation");
    if (!M) return { data: [], count: 0 };
    const [data, count] = await Promise.all([
      M.find(filter)
        .sort({ createdAt: -1 })
        .skip(from)
        .limit(take)
        .select("createdAt platform status bot visitor")
        .populate("bot", "name")
        .lean(),
      M.countDocuments(filter),
    ]);
    return { data, count };
  }

  /**
   * Header data for the Agent_View: the contact, `unavailable` when it was
   * archived or deleted (R3.8), or `null` when nothing is linked.
   */
  async contactForConversation(orgId: string, conversationId: string) {
    const conv = await this.scopedConversation(orgId, conversationId);
    if (!conv) throw new NotFoundException("Conversation not found");
    if (!conv.crmContactId) return { linked: false };
    const contact = await this.resolver.summary(orgId, conv.crmContactId);
    if (!contact) return { linked: true, unavailable: true };
    return {
      linked: true,
      unavailable: false,
      contact: {
        id: contact.id,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
        isAnonymous: contact.isAnonymous,
      },
    };
  }

  /** Agent-entered details: same matching as chat, no visitor question. */
  async addDetails(orgId: string, conversationId: string, raw: { name?: string; email?: string; phone?: string }) {
    const conv = await this.scopedConversation(orgId, conversationId);
    if (!conv) return null;
    const details = cleanDetails(raw);
    if (raw.email?.trim() && !details.email) throw new BadRequestException("That email address is not valid.");
    if (raw.phone?.trim() && !details.phone) throw new BadRequestException("That phone number is not valid.");
    const ctx = {
      conversationId: String(conv._id),
      visitorId: conv.visitor ? String(conv.visitor) : undefined,
      botId: String(conv.bot),
      channel: conv.platform,
    };
    if (!hasIdentifier(details)) {
      // Name only: rename the linked contact (anonymous placeholder or a
      // chat-set name; a person's edit is never overwritten).
      if (!conv.crmContactId) {
        throw new BadRequestException("Add an email or phone to create the contact.");
      }
      await this.renameOnly(orgId, conv.crmContactId, details.name);
      // The conversation shows the new name too (crm-plugins-service-desk R4).
      await this.capture?.applyToVisitor(ctx, details).catch(() => false);
      return this.contactForConversation(orgId, conversationId);
    }
    // Same path as every other source, so the visitor record and the shown
    // name follow too (crm-plugins-service-desk R1.7).
    const res = this.capture
      ? await this.capture.capture(ctx, details, "agent", { noConflictPrompt: true })
      : await this.bridge.capture(ctx, details, { noConflictPrompt: true, source: "agent" });
    // null = CRM unreachable; the write is queued and retried (R2.8).
    if (!res) return { queued: true };
    return this.contactForConversation(orgId, conversationId);
  }

  /** The agent's name for the person replaces the stored one (D11). */
  private async renameOnly(orgId: string, contactId: string, name?: string) {
    if (!name) return;
    await this.resolver.fillName(orgId, contactId, name);
  }

  private async scopedConversation(orgId: string, conversationId: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const botIds = await this.orgBotIds(orgId);
    return (
      (await this.model("Conversation")
        ?.findOne({ _id: conversationId, bot: { $in: botIds } })
        .select("crmContactId bot visitor platform")
        .lean()) ?? null
    );
  }

  private async orgBotIds(orgId: string): Promise<Types.ObjectId[]> {
    if (!Types.ObjectId.isValid(orgId)) return [];
    const bots = await this.model("Bot")?.find({ organizationId: orgId }).select("_id").lean();
    return (bots || []).map((b: any) => b._id);
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}
