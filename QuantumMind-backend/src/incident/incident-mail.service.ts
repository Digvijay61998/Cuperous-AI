import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ActivityType } from "@prisma/client";
import { Model } from "mongoose";
import { TenantContext } from "src/common/tenant/tenant-context";
import { formatInOrgTz } from "src/common/time/org-time";
import { CHAT_SYSTEM_USER } from "src/crm-bridge/contact-resolver.service";
import { CRM_CONTACT_LINKED } from "src/crm-bridge/crm-bridge.service";
import { normalizeEmail } from "src/crm-bridge/identity";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { MailsService } from "src/mails/mails.service";
import { INCIDENT_OPENED, INCIDENT_PROVIDER } from "./constants";
import { IncidentDocument } from "./entities/incident.entity";
import { IncidentService } from "./incident.service";

export const EMAIL_REPLY_MIN = 1;
export const EMAIL_REPLY_MAX = 5000;

/**
 * Incident emails (design §14, R19.4):
 * - acknowledgement to the contact when an incident opens and a valid email
 *   is on file (never blocks the chat: runs off `incident.opened`);
 * - agent email reply from the incident view, recorded as a CRM Activity.
 * Delivery status is stored on the incident so the dashboard can show it.
 */
@Injectable()
export class IncidentMailService {
  private readonly logger = new Logger(IncidentMailService.name);

  constructor(
    @Inject(INCIDENT_PROVIDER) private readonly model: Model<IncidentDocument>,
    private readonly incidents: IncidentService,
    private readonly crm: CrmPrismaService,
    @Optional() private readonly mails?: MailsService,
  ) {}

  @OnEvent(INCIDENT_OPENED, { async: true })
  async onIncidentOpened(e: { incidentId: string; organizationId?: string }) {
    try {
      await this.sendAcknowledgement(e.incidentId);
    } catch (error) {
      this.logger.warn(`Ack mail for ${e?.incidentId} not sent: ${error?.message}`);
    }
  }

  /** Details given after the handover: send the ack now if it had no email. */
  @OnEvent(CRM_CONTACT_LINKED, { async: true })
  async onContactLinked(e: { conversationId: string }) {
    try {
      const open = await this.incidents.findOpenByConversation(e?.conversationId);
      if (open && (!open.mail?.ack || open.mail.ack.status === "no_email")) {
        await this.sendAcknowledgement(String(open._id));
      }
    } catch (error) {
      this.logger.warn(`Ack mail after link not sent: ${error?.message}`);
    }
  }

  /**
   * Send the ticket acknowledgement once per incident. The contact may be
   * linked a moment after the incident opens, so a missing email is not an
   * error; it is simply skipped.
   */
  async sendAcknowledgement(incidentId: string): Promise<"sent" | "skipped" | "failed"> {
    if (!this.mails) return "skipped";
    // Claim the send so two triggers never mail twice. A `no_email` result
    // may be retried once a contact with an email is linked.
    const claimed: any = await this.model
      .findOneAndUpdate(
        {
          _id: incidentId,
          $or: [{ "mail.ack": { $exists: false } }, { "mail.ack.status": "no_email" }],
        },
        { $set: { "mail.ack": { status: "sending", at: new Date() } } },
        { new: true },
      )
      .lean();
    if (!claimed) return "skipped";
    const target = await this.recipient(claimed);
    if (!target) {
      await this.setAck(incidentId, { status: "no_email", at: new Date() });
      return "skipped";
    }
    try {
      await this.mails.sendTemplate(
        target.email,
        `Your request ${claimed.ticketRef ?? ""} has been recorded`.trim(),
        "ticket-ack.hbs",
        {
          name: target.name,
          orgName: target.orgName,
          ticketRef: claimed.ticketRef ?? "",
          problem: claimed.problem ?? "",
          date: formatInOrgTz(claimed.createdAt ?? new Date(), target.org),
        },
      );
      await this.setAck(incidentId, { status: "sent", at: new Date() });
      return "sent";
    } catch (error) {
      await this.setAck(incidentId, { status: "failed", at: new Date(), error: String(error?.message ?? error).slice(0, 300) });
      return "failed";
    }
  }

  /** Agent replies by email from the incident (R19.4). Owner or org admin only. */
  async emailReply(incidentId: string, user: TenantContext & { name?: string }, body: unknown) {
    const text = typeof body === "string" ? body.trim() : "";
    if (text.length < EMAIL_REPLY_MIN || text.length > EMAIL_REPLY_MAX) {
      throw new BadRequestException(`Message must be ${EMAIL_REPLY_MIN} to ${EMAIL_REPLY_MAX} characters.`);
    }
    const incident = await this.incidents.findOneScoped(incidentId, user);
    const me = String((user as any)?._id ?? "");
    const isAdmin = String((user as any)?.role) === "org_admin";
    if (incident.agentId && incident.agentId !== me && !isAdmin) {
      throw new ForbiddenException("Only the agent handling this incident can reply.");
    }
    const target = await this.recipient(incident);
    if (!target) throw new BadRequestException("No valid email is on file for this contact.");
    if (!this.mails) throw new BadRequestException("Email is not configured.");

    await this.mails.sendTemplate(
      target.email,
      `Re: your request ${incident.ticketRef ?? ""}`.trim(),
      "incident-reply.hbs",
      {
        name: target.name,
        body: text,
        agentName: (user as any)?.name || "Support team",
        orgName: target.orgName,
        ticketRef: incident.ticketRef ?? "",
      },
      // The agent is waiting on the request: one quick retry, then report.
      { retryDelaysMs: [2000] },
    );

    if (incident.crmContactId && incident.organizationId) {
      const orgId = String(incident.organizationId);
      await this.crm
        .forOrg(orgId)
        .activity.create({
          data: {
            organizationId: orgId,
            type: ActivityType.EMAIL,
            subject: `Email reply on ${incident.ticketRef ?? "incident"}`,
            body: text.slice(0, 2000),
            occurredAt: new Date(),
            contactId: incident.crmContactId,
            createdById: me || CHAT_SYSTEM_USER,
            meta: { kind: "incident_email_reply", incidentId: String(incident._id) },
          },
        })
        .catch((e) => this.logger.warn(`Reply activity not recorded: ${e?.message}`));
    }
    return { sent: true, to: maskEmail(target.email) };
  }

  /** Contact email from the CRM, else the visitor email; never a placeholder. */
  private async recipient(incident: any) {
    const orgId = incident.organizationId ? String(incident.organizationId) : null;
    let email: string | undefined;
    let name = "there";
    if (orgId && incident.crmContactId) {
      const c = await this.crm
        .forOrg(orgId)
        .contact.findFirst({
          where: { id: incident.crmContactId, organizationId: orgId, archivedAt: null },
          select: { email: true, firstName: true, isAnonymous: true },
        })
        .catch(() => null);
      email = normalizeEmail(c?.email);
      if (c?.firstName && !c.isAnonymous) name = c.firstName;
    }
    if (!email && incident.visitorId) {
      const v: any = await this.model.db.models["Visitor"]
        ?.findById(incident.visitorId)
        .select("email name")
        .lean()
        .catch(() => null);
      email = normalizeEmail(v?.email);
      if (v?.name && name === "there" && v.name !== "Anonymous") name = v.name;
    }
    if (!email) return null;
    const org: any = orgId
      ? await this.model.db.models["Organization"]?.findById(orgId).select("name country timeZone").lean().catch(() => null)
      : null;
    return { email, name, orgName: org?.name || "our team", org };
  }

  private setAck(incidentId: string, ack: Record<string, unknown>) {
    return this.model.updateOne({ _id: incidentId }, { $set: { "mail.ack": ack } }).catch(() => undefined);
  }
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
