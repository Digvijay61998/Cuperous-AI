import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import mongoose, { Connection, Types } from "mongoose";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { ContactResolverService } from "./contact-resolver.service";
import { CrmBridgeService } from "./crm-bridge.service";
import { cleanDetails, ContactMapping, DEFAULT_CONTACT_MAPPING } from "./identity";
import { IdentityChoice, KnownDetails, PendingIdentity } from "./identity-prompt";

export * from "./identity-prompt";

/**
 * Identity questions and "ask once" support (design §3, R16, R17).
 * Never throws: on CRM errors it answers "nothing known" and the flow
 * asks normally.
 */
@Injectable()
export class IdentityPromptService {
  private readonly logger = new Logger(IdentityPromptService.name);

  constructor(
    private readonly resolver: ContactResolverService,
    private readonly bridge: CrmBridgeService,
    private readonly tenantScope: TenantScopeService,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }

  /**
   * Known contact details for a conversation (R16.1, R16.4): the
   * conversation's own attributes first, then the Visitor record (pre-chat
   * form, WhatsApp number; works with the CRM down), then the linked CRM
   * contact (a returning visitor). Anonymous placeholders and invented
   * visitor values never count. Always on (crm-plugins-service-desk R23).
   */
  async known(input: {
    botId: string;
    conversationId: string;
    visitorId?: string;
    attributes?: Record<string, unknown>;
    botSettings?: { features?: any; contactMapping?: ContactMapping } | null;
  }): Promise<KnownDetails> {
    const m = input.botSettings?.contactMapping;
    const mapping = m && (m.name || m.email || m.phone) ? m : DEFAULT_CONTACT_MAPPING;
    const out: KnownDetails = cleanDetails({
      name: mapping.name ? input.attributes?.[mapping.name] : undefined,
      email: mapping.email ? input.attributes?.[mapping.email] : undefined,
      phone: mapping.phone ? input.attributes?.[mapping.phone] : undefined,
    });
    if (out.name && out.email && out.phone) return out;
    try {
      const v: any =
        input.visitorId && Types.ObjectId.isValid(input.visitorId)
          ? await this.model("Visitor")?.findById(input.visitorId).select("name email phone").lean()
          : null;
      if (v) {
        // cleanDetails drops "Anonymous", @nomemail.com and 0000000000.
        const fromVisitor = cleanDetails({ name: v.name, email: v.email, phone: v.phone });
        out.name = out.name ?? fromVisitor.name;
        out.email = out.email ?? fromVisitor.email;
        out.phone = out.phone ?? fromVisitor.phone;
      }
    } catch (error) {
      this.logger.warn(`known() could not read the visitor: ${error?.message}`);
    }
    if (out.name && out.email && out.phone) return out;
    try {
      const contactId =
        (await this.bridge.linkedContactId(input.conversationId)) ??
        (input.visitorId ? await this.bridge.visitorContactId(input.visitorId) : null);
      if (!contactId) return out;
      const orgId = await this.tenantScope.orgIdForBot(input.botId);
      if (!orgId) return out;
      const c = await this.resolver.summary(orgId, contactId);
      if (!c || c.isAnonymous) return out;
      const crm = cleanDetails({
        name: [c.firstName, c.lastName].filter(Boolean).join(" "),
        email: c.email,
        phone: c.phone,
      });
      return { name: out.name ?? crm.name, email: out.email ?? crm.email, phone: out.phone ?? crm.phone };
    } catch (error) {
      this.logger.warn(`known() fell back to attributes: ${error?.message}`);
      return out;
    }
  }

  /** Apply the visitor's answer, or record a proposal when they never answered. */
  async settle(botId: string, pending: PendingIdentity, choice: IdentityChoice | "unanswered"): Promise<void> {
    try {
      const orgId = await this.tenantScope.orgIdForBot(botId);
      if (!orgId) return;
      if (choice === "unanswered") {
        await this.resolver.proposeUnanswered(orgId, pending.contactId, pending);
      } else {
        await this.resolver.applyConflictChoice(orgId, pending.contactId, pending, choice);
      }
    } catch (error) {
      this.logger.warn(`Identity choice not applied: ${error?.message}`);
    }
  }
}
