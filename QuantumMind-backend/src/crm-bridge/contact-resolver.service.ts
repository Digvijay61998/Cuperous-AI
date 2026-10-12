import { Injectable, Logger } from "@nestjs/common";
import { ActivityType, FactBand, FactStatus, IdentifierKind, Prisma, RecordSource } from "@prisma/client";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { isUniqueViolation } from "src/crm/common/prisma-errors";
import {
  anonymousSuffix,
  ANONYMOUS_FIRST_NAME,
  ChannelIdentity,
  CleanDetails,
  cleanDetails,
  Conflict,
  ContactRow,
  hasIdentifier,
  lockKey,
  normalizePhone,
  phoneKey,
  planFill,
  splitName,
} from "./identity";
import {
  applyOverrides,
  entryKey,
  fitProfile,
  parseProfile,
  sortEntries,
} from "src/profile/profile-schema";

/** Author id for chat-written CRM rows (no Mongo user). */
export const CHAT_SYSTEM_USER = "system:chat";

const CONTACT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  phoneNormalized: true,
  isAnonymous: true,
  fieldSources: true,
  visitorIds: true,
  altIdentifiers: true,
  companyId: true,
  ownerId: true,
  createdAt: true,
} satisfies Prisma.ContactSelect;

type Row = Prisma.ContactGetPayload<{ select: typeof CONTACT_SELECT }>;

export type ResolveOutcome =
  | { kind: "none" }
  | { kind: "linked"; contactId: string; created: boolean; merged?: boolean }
  /**
   * No longer produced: a different email/phone is now stored as the new
   * Current value with the old one kept (crm-plugins-service-desk R21.2).
   * Kept in the type so prompts already pending can still be settled.
   */
  | { kind: "conflict"; contactId: string; conflict: Conflict };

export interface ResolveInput {
  details: CleanDetails;
  /** Contact already linked to this conversation (anonymous upgrade, R20.3). */
  currentContactId?: string;
  /** Accepted for compatibility; conflicts are no longer asked about (R21.2). */
  noConflictPrompt?: boolean;
  /** Capture source, stored on a created contact and on its identifiers (R5). */
  source?: string;
}

/**
 * A contact chat may freely upgrade or fold into a real one: the anonymous
 * handover placeholder, or a platform-only lead (Telegram / Messenger /
 * hidden WhatsApp) that no person has worked on yet (R20.3, R22.4).
 */
export function isPlaceholder(r: {
  isAnonymous?: boolean | null;
  email?: string | null;
  phone?: string | null;
  companyId?: string | null;
  ownerId?: string | null;
  fieldSources?: unknown;
}): boolean {
  if (r.isAnonymous) return true;
  const sources = (r.fieldSources as Record<string, string> | null) || {};
  return !r.email && !r.phone && !r.companyId && !r.ownerId && sources.firstName === "chat";
}

const toRow = (r: Row): ContactRow & Row => ({
  ...r,
  namePlaceholder: !r.isAnonymous && isPlaceholder(r),
  fieldSources: (r.fieldSources as any) ?? null,
});

const emailKey = (email: string) => email.trim().toLowerCase();

/**
 * Find-or-create one CRM contact per person in an org (R2, R17, R20).
 *
 * Concurrency (Property 1): every match-or-create runs in a transaction that
 * first takes a Postgres advisory lock per (org, identifier), so two captures
 * of the same email or phone serialise. The partial unique index on
 * lower(email) is the backstop: a P2002 re-reads the winner.
 *
 * Throws on CRM errors; callers (the bridge) park the work in the outbox.
 */
@Injectable()
export class ContactResolverService {
  private readonly logger = new Logger(ContactResolverService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  async resolve(orgId: string, input: ResolveInput): Promise<ResolveOutcome> {
    const details = input.details;
    if (!orgId || !hasIdentifier(details)) return { kind: "none" };
    try {
      return await this.resolveLocked(orgId, input);
    } catch (error) {
      // Lost an email-uniqueness race the lock did not cover (different
      // phone key, same email): the winner exists now, so retry once.
      if (isUniqueViolation(error)) return this.resolveLocked(orgId, input);
      throw error;
    }
  }

  private async resolveLocked(orgId: string, input: ResolveInput): Promise<ResolveOutcome> {
    const { details, source } = input;
    const db = this.crm.forOrg(orgId);
    return db.$transaction(async (tx) => {
      // Lock in a fixed order so two transactions never deadlock.
      const keys = [
        details.email && `e:${details.email}`,
        details.phone && `p:${phoneKey(details.phone)}`,
        details.channel && `c:${details.channel.kind}:${details.channel.value}`,
      ]
        .filter(Boolean)
        .sort() as string[];
      for (const k of keys) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, k)})`;
      }

      const byEmail = details.email ? await this.findByEmail(tx, orgId, details.email) : null;
      const byPhone = details.phone ? await this.findByPhone(tx, orgId, details.phone) : null;
      const byChannel = details.channel ? await this.findByChannel(tx, orgId, details.channel) : null;
      const current = input.currentContactId
        ? await tx.contact.findFirst({
            where: { id: input.currentContactId, organizationId: orgId, archivedAt: null },
            select: CONTACT_SELECT,
          })
        : null;
      const currentIsPlaceholder = !!current && isPlaceholder(current);

      // The conversation's placeholder (anonymous or platform-only) and
      // nobody else matches: upgrade it in place (R20.3, R22.4).
      const others = [byEmail, byPhone, byChannel].filter((m) => m && m.id !== current?.id);
      if (current && currentIsPlaceholder && others.length === 0) {
        await this.applyAndClaim(tx, orgId, current, details, source, { clearAnonymous: true });
        return { kind: "linked", contactId: current.id, created: false };
      }

      // R17.4: email and phone hit two different people. Link to the email
      // match, ask nothing, leave a merge suggestion on both.
      if (byEmail && byPhone && byEmail.id !== byPhone.id) {
        await this.mergeSuggestion(tx, orgId, byEmail.id, byPhone.id, details);
        // The phone belongs to the other contact: never copy it onto the
        // email match, or two contacts would share one phone (R2.7, R21.4).
        return this.finishMatch(tx, orgId, byEmail, { ...details, phone: undefined }, current, source);
      }

      // Any one identifier matching is the same person (R21.1, D8).
      const match = byEmail ?? byPhone ?? byChannel;
      if (match) return this.finishMatch(tx, orgId, match, details, current, source);

      // No match at all.
      if (current && !currentIsPlaceholder) {
        // Linked to a real contact that does not share these identifiers:
        // treat as more details for that person.
        await this.applyAndClaim(tx, orgId, current, details, source);
        return { kind: "linked", contactId: current.id, created: false };
      }
      // Create (R2.3, R2.5, R22.3).
      const { firstName, lastName } = splitName(details.name, details.email);
      const created = await tx.contact.create({
        data: {
          organizationId: orgId,
          firstName,
          lastName,
          email: details.email ?? null,
          phone: details.phone ?? null,
          phoneNormalized: details.phone ?? null,
          source: RecordSource.CHAT,
          sourceChannel: source ?? null,
          fieldSources: this.chatSources(details) as Prisma.InputJsonValue,
          ownerId: null,
        },
        select: { id: true },
      });
      await this.claimGiven(tx, orgId, created.id, details, source);
      return { kind: "linked", contactId: created.id, created: true };
    });
  }

  /**
   * Matched one contact: the newest email/phone become Current, earlier ones
   * are kept (R21.2, R21.3). A placeholder linked to this conversation that
   * turns out to be this person is folded in (R20.3, R22.4).
   */
  private async finishMatch(
    tx: Prisma.TransactionClient,
    orgId: string,
    match: Row,
    details: CleanDetails,
    current: Row | null,
    source?: string,
  ): Promise<ResolveOutcome> {
    await this.applyAndClaim(tx, orgId, match, details, source);
    if (current && current.id !== match.id && isPlaceholder(current)) {
      await this.mergePlaceholderInto(tx, orgId, current, match.id);
      return { kind: "linked", contactId: match.id, created: false, merged: true };
    }
    return { kind: "linked", contactId: match.id, created: false };
  }

  /**
   * Name-only capture on an already-linked contact (R1.6, D7): fill or replace
   * a placeholder name under the same rules as a full capture. Never creates.
   * Returns true when the contact changed.
   */
  async fillName(orgId: string, contactId: string, name: string, opts: { weakName?: boolean } = {}): Promise<boolean> {
    const details = cleanDetails({ name, weakName: opts.weakName });
    if (!details.name) return false;
    const db = this.crm.forOrg(orgId);
    return db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, `contact:${contactId}`)})`;
      const c = await tx.contact.findFirst({
        where: { id: contactId, organizationId: orgId, archivedAt: null },
        select: CONTACT_SELECT,
      });
      if (!c) return false;
      const plan = planFill(toRow(c), details);
      if (!Object.keys(plan.data).length) return false;
      // Still no identifier: an anonymous placeholder stays anonymous so a
      // later email/phone still upgrades or merges it.
      await tx.contact.update({
        where: { id: c.id },
        data: { ...plan.data, fieldSources: plan.fieldSources as Prisma.InputJsonValue },
      });
      return true;
    });
  }

  /** Apply the visitor's answer to an identity question (R17.3). */
  async applyConflictChoice(
    orgId: string,
    contactId: string,
    conflict: { field: "email" | "phone"; newValue: string },
    choice: "keep_existing" | "use_new" | "keep_both",
  ): Promise<void> {
    if (choice === "keep_existing") return;
    const db = this.crm.forOrg(orgId);
    await db.$transaction(async (tx) => {
      const c = await tx.contact.findFirst({
        where: { id: contactId, organizationId: orgId, archivedAt: null },
        select: CONTACT_SELECT,
      });
      if (!c) return;
      const sources = ((c.fieldSources as any) || {}) as Record<string, string>;
      if (choice === "use_new") {
        // A person-owned field is never overwritten by chat (R17.6).
        if (sources[conflict.field] !== "chat") {
          await this.propose(tx, orgId, contactId, conflict.field, conflict.newValue);
          return;
        }
        const old = conflict.field === "email" ? c.email : c.phone;
        await tx.contact.update({
          where: { id: contactId },
          data: {
            ...(conflict.field === "email"
              ? { email: conflict.newValue }
              : { phone: conflict.newValue, phoneNormalized: conflict.newValue }),
            altIdentifiers: this.addAlt(c.altIdentifiers, conflict.field, old) as Prisma.InputJsonValue,
          },
        });
        return;
      }
      await tx.contact.update({
        where: { id: contactId },
        data: {
          altIdentifiers: this.addAlt(c.altIdentifiers, conflict.field, conflict.newValue) as Prisma.InputJsonValue,
        },
      });
    });
  }

  /** No answer to the identity question within 2 turns (R17.5). */
  async proposeUnanswered(
    orgId: string,
    contactId: string,
    conflict: { field: "email" | "phone"; newValue: string },
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    await db.$transaction((tx) => this.propose(tx, orgId, contactId, conflict.field, conflict.newValue));
  }

  /**
   * Anonymous contact for a handover with no identifiers (R20.1). Idempotent
   * per seed (the conversation id): a retry reuses the same row.
   */
  async createAnonymous(orgId: string, seed: string, visitorId?: string): Promise<string> {
    const db = this.crm.forOrg(orgId);
    const suffix = anonymousSuffix(seed);
    return db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, `anon:${seed}`)})`;
      // Matched on the full seed, never on the short display suffix: two
      // visitors whose suffixes collide must not share a contact.
      const existing = await tx.contact.findFirst({
        where: {
          organizationId: orgId,
          isAnonymous: true,
          archivedAt: null,
          altIdentifiers: { path: ["anonSeed"], equals: seed },
        },
        select: { id: true },
      });
      if (existing) return existing.id;
      const created = await tx.contact.create({
        data: {
          organizationId: orgId,
          firstName: ANONYMOUS_FIRST_NAME,
          lastName: suffix,
          isAnonymous: true,
          source: RecordSource.CHAT,
          visitorIds: visitorId ? [visitorId] : [],
          altIdentifiers: { anonSeed: seed },
          fieldSources: { firstName: "chat", lastName: "chat" },
        },
        select: { id: true },
      });
      return created.id;
    });
  }

  /**
   * Record the conversation link on the contact: visitor id (no duplicates,
   * R3.1, R3.5) and exactly one `chat_linked` Activity per conversation (R3.2).
   * Idempotent, so an outbox retry never duplicates anything (R3.9).
   */
  async recordLink(
    orgId: string,
    contactId: string,
    link: { conversationId: string; visitorId?: string; botName?: string; channel?: string; at?: Date },
  ): Promise<void> {
    const db = this.crm.forOrg(orgId);
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, `link:${link.conversationId}`)})`;
      const c = await tx.contact.findFirst({
        where: { id: contactId, organizationId: orgId },
        select: { id: true, visitorIds: true },
      });
      if (!c) return;
      if (link.visitorId && !c.visitorIds.includes(link.visitorId)) {
        await tx.contact.update({
          where: { id: contactId },
          data: { visitorIds: { push: link.visitorId } },
        });
      }
      const already = await tx.activity.findFirst({
        where: {
          organizationId: orgId,
          contactId,
          meta: { path: ["conversationId"], equals: String(link.conversationId) },
        },
        select: { id: true },
      });
      if (already) return;
      const at = link.at ?? new Date();
      await tx.activity.create({
        data: {
          organizationId: orgId,
          type: ActivityType.NOTE,
          subject: "Chat linked",
          body: `Conversation via ${link.channel ?? "widget"}${link.botName ? ` with ${link.botName}` : ""}.`,
          occurredAt: at,
          contactId,
          createdById: CHAT_SYSTEM_USER,
          meta: {
            kind: "chat_linked",
            conversationId: String(link.conversationId),
            botName: link.botName ?? null,
            channel: link.channel ?? "widget",
            linkedAt: at.toISOString(),
          },
        },
      });
      await tx.contact.update({ where: { id: contactId }, data: { lastActivityAt: at } });
    });
  }

  /** Display data for a linked contact, or null if archived/missing (R3.8). */
  async summary(orgId: string, contactId: string) {
    const c = await this.crm.forOrg(orgId).contact.findFirst({
      where: { id: contactId, organizationId: orgId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isAnonymous: true,
        archivedAt: true,
      },
    });
    if (!c || c.archivedAt) return null;
    return c;
  }

  // ---------------------------------------------------------- internals

  /**
   * Current email of an active contact first (rows typed by hand have no
   * identifier rows), then any email the person gave before (R21.1).
   * Earliest-created match wins (R2.10).
   */
  private async findByEmail(tx: Prisma.TransactionClient, orgId: string, email: string) {
    const current = await tx.contact.findFirst({
      where: { organizationId: orgId, archivedAt: null, email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
      select: CONTACT_SELECT,
    });
    return current ?? this.findByIdentifier(tx, orgId, IdentifierKind.EMAIL, emailKey(email));
  }

  private async findByPhone(tx: Prisma.TransactionClient, orgId: string, phone: string) {
    const key = phoneKey(phone)!;
    // phoneNormalized covers chat-written rows; legacy rows only have `phone`,
    // so compare its digits too.
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "contact"
      WHERE "organizationId" = ${orgId} AND "archivedAt" IS NULL
        AND (regexp_replace(coalesce("phoneNormalized", ''), '\\D', '', 'g') = ${key}
          OR regexp_replace(coalesce("phone", ''), '\\D', '', 'g') = ${key})
      ORDER BY "createdAt" ASC
      LIMIT 1`;
    if (rows.length) return tx.contact.findFirst({ where: { id: rows[0].id }, select: CONTACT_SELECT });
    return this.findByIdentifier(tx, orgId, IdentifierKind.PHONE, key);
  }

  private findByChannel(tx: Prisma.TransactionClient, orgId: string, channel: ChannelIdentity) {
    return this.findByIdentifier(tx, orgId, channel.kind as IdentifierKind, channel.value);
  }

  private async findByIdentifier(
    tx: Prisma.TransactionClient,
    orgId: string,
    kind: IdentifierKind,
    value: string,
  ): Promise<Row | null> {
    const hit = await tx.contactIdentifier.findFirst({
      where: { organizationId: orgId, kind, value, contact: { archivedAt: null } },
      select: { contact: { select: CONTACT_SELECT } },
    });
    return hit?.contact ?? null;
  }

  /**
   * Write a capture onto `row` and record every value given. The Current
   * email/phone about to be replaced are recorded first, so contacts from
   * before identifiers existed keep their history (R21.2).
   */
  private async applyAndClaim(
    tx: Prisma.TransactionClient,
    orgId: string,
    row: Row,
    details: CleanDetails,
    source?: string,
    opts: { clearAnonymous?: boolean } = {},
  ) {
    if (details.email && row.email && emailKey(row.email) !== details.email) {
      await this.ensureIdentifier(tx, orgId, row.id, IdentifierKind.EMAIL, row.email, { touch: false });
    }
    if (details.phone && row.phone && phoneKey(row.phone) && phoneKey(row.phone) !== phoneKey(details.phone)) {
      await this.ensureIdentifier(tx, orgId, row.id, IdentifierKind.PHONE, row.phone, { touch: false });
    }
    await this.applyFill(tx, orgId, toRow(row), details, opts);
    await this.claimGiven(tx, orgId, row.id, details, source);
  }

  private async claimGiven(
    tx: Prisma.TransactionClient,
    orgId: string,
    contactId: string,
    details: CleanDetails,
    source?: string,
  ) {
    if (details.email) await this.ensureIdentifier(tx, orgId, contactId, IdentifierKind.EMAIL, details.email, { source });
    if (details.phone) await this.ensureIdentifier(tx, orgId, contactId, IdentifierKind.PHONE, details.phone, { source });
    if (details.channel) {
      await this.ensureIdentifier(tx, orgId, contactId, details.channel.kind as IdentifierKind, details.channel.value, { source });
    }
  }

  /**
   * Record that `contactId` uses this identifier (R21.3, R21.5).
   * - new: created; already ours: last-given time bumped when `touch`;
   * - owned by an archived contact: taken over;
   * - owned by another active contact: left alone (returns false).
   */
  private async ensureIdentifier(
    tx: Prisma.TransactionClient,
    orgId: string,
    contactId: string,
    kind: IdentifierKind,
    raw: string,
    opts: { source?: string; touch?: boolean } = {},
  ): Promise<boolean> {
    const { value, display } = identifierKey(kind, raw);
    if (!value) return false;
    const now = new Date();
    const find = () =>
      tx.contactIdentifier.findFirst({
        where: { organizationId: orgId, kind, value },
        select: { id: true, contactId: true, contact: { select: { archivedAt: true } } },
      });
    let existing = await find();
    if (!existing) {
      // ON CONFLICT DO NOTHING: a contact's previous email/phone is recorded
      // without that identifier's advisory lock, so a concurrent capture may
      // insert the same row; never fail the capture over it.
      const { count } = await tx.contactIdentifier.createMany({
        data: [
          {
            organizationId: orgId,
            contactId,
            kind,
            value,
            display,
            source: opts.source ?? null,
            firstSeenAt: now,
            lastSeenAt: now,
          },
        ],
        skipDuplicates: true,
      });
      if (count) return true;
      existing = await find();
      if (!existing) return false;
    }
    const mine = existing.contactId === contactId;
    if (!mine && existing.contact && !existing.contact.archivedAt) return false;
    if (mine && opts.touch === false) return true;
    await tx.contactIdentifier.update({
      where: { id: existing.id },
      data: {
        contactId,
        display,
        ...(opts.touch === false ? {} : { lastSeenAt: now }),
        ...(opts.source ? { source: opts.source } : {}),
      },
    });
    return true;
  }

  private chatSources(d: CleanDetails): Record<string, string> {
    const s: Record<string, string> = { firstName: "chat", lastName: "chat" };
    if (d.email) s.email = "chat";
    if (d.phone) s.phone = "chat";
    return s;
  }

  private async applyFill(
    tx: Prisma.TransactionClient,
    orgId: string,
    contact: ContactRow,
    details: CleanDetails,
    opts: { clearAnonymous?: boolean } = {},
  ) {
    const plan = planFill(contact, details);
    const data: Prisma.ContactUpdateInput = { ...plan.data };
    if (
      opts.clearAnonymous &&
      contact.isAnonymous &&
      (details.email || details.phone || details.channel || details.name)
    ) {
      data.isAnonymous = false;
      if (!details.name) {
        // Placeholder name goes away once we know who this is (R20.3).
        const n = splitName(undefined, details.email);
        data.firstName = n.firstName;
        data.lastName = n.lastName;
      }
    }
    if (Object.keys(data).length) {
      data.fieldSources = plan.fieldSources as Prisma.InputJsonValue;
      await tx.contact.update({ where: { id: contact.id }, data });
    }
    for (const p of plan.proposals) await this.propose(tx, orgId, contact.id, p.field, p.value);
  }

  /** A PROPOSED ContactFact for a person to accept (R17.5, R17.6). Deduped. */
  private async propose(
    tx: Prisma.TransactionClient,
    orgId: string,
    contactId: string,
    field: string,
    value: string,
  ) {
    const dup = await tx.contactFact.findFirst({
      where: {
        organizationId: orgId,
        contactId,
        field,
        value,
        status: { in: [FactStatus.PROPOSED, FactStatus.DISMISSED] },
      },
      select: { id: true },
    });
    if (dup) return;
    await tx.contactFact.create({
      data: {
        organizationId: orgId,
        contactId,
        field,
        value,
        score: 0.5,
        band: FactBand.POSSIBLE,
        evidence: [{ kind: "chat", detail: "Stated by the visitor in chat" }] as Prisma.InputJsonValue,
        method: "chat",
        status: FactStatus.PROPOSED,
      },
    });
  }

  private async mergeSuggestion(
    tx: Prisma.TransactionClient,
    orgId: string,
    emailContactId: string,
    phoneContactId: string,
    details: CleanDetails,
  ) {
    const pairKey = [emailContactId, phoneContactId].sort().join(":");
    for (const [self, other] of [
      [emailContactId, phoneContactId],
      [phoneContactId, emailContactId],
    ]) {
      const exists = await tx.activity.findFirst({
        where: { organizationId: orgId, contactId: self, meta: { path: ["mergePair"], equals: pairKey } },
        select: { id: true },
      });
      if (exists) continue;
      await tx.activity.create({
        data: {
          organizationId: orgId,
          type: ActivityType.NOTE,
          subject: "Possible duplicate contact",
          body: "A visitor gave an email and a phone that belong to two different contacts. Review and merge if they are the same person.",
          contactId: self,
          createdById: CHAT_SYSTEM_USER,
          occurredAt: new Date(),
          meta: { kind: "merge_suggestion", mergePair: pairKey, otherContactId: other, email: details.email ?? null, phone: details.phone ?? null },
        },
      });
    }
  }

  /**
   * Fold a placeholder (anonymous, or a platform-only lead) into a real
   * contact (R20.3, R22.4): move its activities, identifiers, deal links and
   * visitor ids, merge its profile entries by date, archive it. Mongo links
   * are rewritten by the caller (the bridge) after commit.
   */
  private async mergePlaceholderInto(
    tx: Prisma.TransactionClient,
    orgId: string,
    anon: Row,
    targetId: string,
  ) {
    const target = await tx.contact.findFirst({
      where: { id: targetId, organizationId: orgId },
      select: { visitorIds: true, profile: true },
    });
    const anonFull = await tx.contact.findFirst({ where: { id: anon.id }, select: { profile: true } });
    await tx.activity.updateMany({
      where: { organizationId: orgId, contactId: anon.id },
      data: { contactId: targetId },
    });
    // One owner per identifier: the target cannot already hold these (unique).
    await tx.contactIdentifier.updateMany({
      where: { organizationId: orgId, contactId: anon.id },
      data: { contactId: targetId },
    });
    const deals = await tx.dealContact.findMany({
      where: { organizationId: orgId, contactId: anon.id },
      select: { dealId: true, role: true },
    });
    for (const dc of deals) {
      const already = await tx.dealContact.findFirst({
        where: { dealId: dc.dealId, contactId: targetId },
        select: { dealId: true },
      });
      if (already) {
        await tx.dealContact.delete({ where: { dealId_contactId: { dealId: dc.dealId, contactId: anon.id } } });
      } else {
        await tx.dealContact.update({
          where: { dealId_contactId: { dealId: dc.dealId, contactId: anon.id } },
          data: { contactId: targetId },
        });
      }
    }
    const visitorIds = [...new Set([...(target?.visitorIds ?? []), ...(anon.visitorIds ?? [])])];
    const mergedProfile = mergeProfiles(target?.profile, anonFull?.profile);
    await tx.contact.update({
      where: { id: targetId },
      data: {
        visitorIds,
        ...(mergedProfile ? { profile: mergedProfile as Prisma.InputJsonValue } : {}),
        // An in-flight profile merge for either contact rebases on this (R18.11).
        profileVersion: { increment: 1 },
      },
    });
    await tx.contact.update({
      where: { id: anon.id },
      data: { archivedAt: new Date(), visitorIds: [] },
    });
  }

  private addAlt(alt: unknown, field: "email" | "phone", value: string | null | undefined) {
    const a: { emails?: string[]; phones?: string[] } = { ...((alt as any) || {}) };
    if (!value) return a;
    const k = field === "email" ? "emails" : "phones";
    a[k] = [...new Set([...(a[k] || []), value])].slice(-10);
    return a;
  }
}

/**
 * Match key and display form of an identifier: lower-case email, phone
 * digits (so "+91 98…" and "9198…" are one phone), platform ids as given.
 */
export function identifierKey(kind: IdentifierKind, raw: string): { value: string; display: string } {
  const v = String(raw ?? "").trim();
  if (kind === IdentifierKind.EMAIL) return { value: v.toLowerCase(), display: v.toLowerCase() };
  if (kind === IdentifierKind.PHONE) {
    return { value: phoneKey(v) ?? "", display: normalizePhone(v) ?? v };
  }
  return { value: v, display: v };
}

/**
 * Merge two Visitor_Profiles: union of entries ordered newest first
 * (R20.3), facts from the target win. Null-safe; returns undefined when both
 * are empty so the column stays null.
 */
export function mergeProfiles(target: any, source: any): any {
  const t = parseProfile(target);
  const s = parseProfile(source);
  if (!s) return t ?? undefined;
  if (!t) return s;
  // Entries: union, one per conversation, newest first (R20.3).
  const seen = new Set<string>();
  const entries = [...t.entries, ...s.entries].filter((e) => {
    const k = entryKey(e);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // Both `earlier` buckets keep every ref and their counts (Property 6).
  const earlier =
    t.earlier && s.earlier
      ? {
          from: [t.earlier.from, s.earlier.from].filter(Boolean).sort()[0],
          to: [t.earlier.to, s.earlier.to].filter(Boolean).sort().pop(),
          summary: [s.earlier.summary, t.earlier.summary].filter(Boolean).join(" ").slice(-800),
          count: (t.earlier.count ?? 0) + (s.earlier.count ?? 0),
          incidentRefs: [...new Set([...(t.earlier.incidentRefs ?? []), ...(s.earlier.incidentRefs ?? [])])],
          incidentIds: [...new Set([...(t.earlier.incidentIds ?? []), ...(s.earlier.incidentIds ?? [])])],
        }
      : t.earlier ?? s.earlier ?? null;
  // Facts: the real contact's win; open issues from both, one per ref.
  const issues = [...(t.facts.openIssues ?? [])];
  for (const i of s.facts.openIssues ?? []) {
    const dup = issues.some(
      (x) => (i.ticketRef && x.ticketRef === i.ticketRef) || (i.incidentId && x.incidentId === i.incidentId) || x.text === i.text,
    );
    if (!dup) issues.push(i);
  }
  const facts = { ...s.facts, ...t.facts, ...(issues.length ? { openIssues: issues.slice(0, 10) } : {}) };
  return fitProfile(
    applyOverrides({
      v: 1,
      facts,
      adminOverrides: { ...(s.adminOverrides || {}), ...(t.adminOverrides || {}) },
      entries: sortEntries(entries),
      earlier,
    }),
  );
}
