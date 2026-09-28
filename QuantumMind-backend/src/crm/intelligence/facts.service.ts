import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { FactBand, FactStatus, Prisma } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { type Evidence, scoreEvidence } from "./evidence";

// Which contact column a fact field mirrors (null = no direct column).
const FIELDS: Record<string, string | null> = {
  name: null,
  title: "title",
  linkedinUrl: "linkedinUrl",
  twitterUrl: "twitterUrl",
  githubUrl: "githubUrl",
  employer: null,
  seniority: "seniority",
  function: "function",
  location: null,
  tenure: null,
};

export const FACT_FIELDS = Object.keys(FIELDS);

export type RecordFactInput = {
  contactId: string;
  field: string;
  value: string;
  evidence: Evidence[];
  method: string;
  sourceUrl?: string;
  sessionId?: string;
};

export type RecordFactResult = {
  stored: boolean;
  applied: boolean;
  band: FactBand | null;
  score: number;
  rationale: string;
  reason?: string;
};

@Injectable()
export class FactsService {
  private readonly logger = new Logger(FactsService.name);

  constructor(private readonly crm: CrmPrismaService) {}

  /** Applied + pending facts for a contact, for the record sheet. */
  async listForContact(orgId: string, contactId: string) {
    const db = this.crm.forOrg(orgId);
    return db.contactFact.findMany({
      where: {
        organizationId: orgId,
        contactId,
        status: { in: [FactStatus.APPLIED, FactStatus.PROPOSED] },
      },
      orderBy: { observedAt: "desc" },
      select: {
        id: true,
        field: true,
        value: true,
        score: true,
        band: true,
        evidence: true,
        method: true,
        sourceUrl: true,
        status: true,
        observedAt: true,
      },
    });
  }

  /**
   * The only write path to a contact's fields. The evidence decides the outcome:
   * VERIFIED writes the record; weaker evidence proposes a suggestion under an
   * empty field. Enforces three invariants a prompt cannot: never overwrite a
   * human value, never re-offer a dismissed value, never write without a primary.
   */
  async recordFact(orgId: string, input: RecordFactInput): Promise<RecordFactResult> {
    const db = this.crm.forOrg(orgId);
    const trimmed = input.value.trim();
    const scored = scoreEvidence(input.evidence);
    const base = { score: scored.score, band: scored.band, rationale: scored.rationale };

    if (!(input.field in FIELDS)) {
      return { ...base, stored: false, applied: false, reason: "Unknown field." };
    }
    if (!trimmed) {
      return { ...base, stored: false, applied: false, reason: "Empty value." };
    }
    if (scored.band === null) {
      return {
        ...base,
        stored: false,
        applied: false,
        reason: "Below the floor for keeping — find a source that identifies them.",
      };
    }

    const contact = await db.contact.findFirst({
      where: { id: input.contactId, organizationId: orgId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        seniority: true,
        function: true,
        linkedinUrl: true,
        twitterUrl: true,
        githubUrl: true,
      },
    });
    if (!contact) {
      return { ...base, stored: false, applied: false, reason: "No such contact." };
    }

    const existing = await db.contactFact.findMany({
      where: { organizationId: orgId, contactId: input.contactId, field: input.field },
      select: { id: true, value: true, status: true },
    });

    if (
      existing.some(
        (f) => f.status === FactStatus.DISMISSED && sameValue(f.value, trimmed),
      )
    ) {
      return {
        ...base,
        stored: false,
        applied: false,
        reason: "A person already dismissed this exact value.",
      };
    }

    const currentApplied = existing.find((f) => f.status === FactStatus.APPLIED);
    if (currentApplied && sameValue(currentApplied.value, trimmed)) {
      return { ...base, stored: false, applied: false, reason: "Already on the record." };
    }

    const column = FIELDS[input.field];
    const hasAgentFact = Boolean(currentApplied);

    if (humanOwns({ field: input.field, column, contact, hasAgentFact })) {
      return {
        ...base,
        stored: false,
        applied: false,
        reason: `A person already filled in ${input.field}.`,
      };
    }

    const applies =
      scored.band === FactBand.VERIFIED ||
      fillsBlank({ field: input.field, column, contact, hasAgentFact });

    if (
      !applies &&
      existing.some(
        (f) => f.status === FactStatus.PROPOSED && sameValue(f.value, trimmed),
      )
    ) {
      return {
        ...base,
        stored: false,
        applied: false,
        reason: "This value is already waiting on a rep.",
      };
    }

    await db.$transaction(async (tx) => {
      if (applies) {
        await tx.contactFact.updateMany({
          where: {
            organizationId: orgId,
            contactId: input.contactId,
            field: input.field,
            status: { in: [FactStatus.APPLIED, FactStatus.PROPOSED] },
          },
          data: { status: FactStatus.SUPERSEDED, supersededAt: new Date() },
        });
      }

      await tx.contactFact.create({
        data: {
          organizationId: orgId,
          contactId: input.contactId,
          field: input.field,
          value: trimmed,
          score: scored.score,
          band: scored.band as FactBand,
          evidence: input.evidence as unknown as Prisma.InputJsonValue,
          method: input.method,
          sourceUrl: input.sourceUrl ?? null,
          sessionId: input.sessionId ?? null,
          status: applies ? FactStatus.APPLIED : FactStatus.PROPOSED,
        },
      });

      if (applies) await this.writeColumn(tx, input.contactId, input.field, trimmed);
    });

    return {
      ...base,
      stored: true,
      applied: applies,
      reason: applies ? undefined : "Kept as a suggestion for a rep to accept or dismiss.",
    };
  }

  /** A rep accepts or dismisses a pending suggestion. */
  async decideFact(
    orgId: string,
    factId: string,
    decision: "accept" | "dismiss",
    userId: string,
  ): Promise<{ contactId: string; field: string; applied: boolean }> {
    const db = this.crm.forOrg(orgId);
    const fact = await db.contactFact.findFirst({
      where: { id: factId, organizationId: orgId },
      select: { id: true, contactId: true, field: true, value: true, status: true },
    });
    if (!fact) throw new NotFoundException(`No fact with id ${factId}.`);
    if (fact.status !== FactStatus.PROPOSED) {
      throw new ConflictException("That suggestion has already been settled.");
    }

    const accepted = decision === "accept";

    await db.$transaction(async (tx) => {
      if (accepted) {
        await tx.contactFact.updateMany({
          where: {
            organizationId: orgId,
            contactId: fact.contactId,
            field: fact.field,
            id: { not: fact.id },
            status: { in: [FactStatus.APPLIED, FactStatus.PROPOSED] },
          },
          data: { status: FactStatus.SUPERSEDED, supersededAt: new Date() },
        });
      }

      await tx.contactFact.update({
        where: { id: fact.id },
        data: {
          status: accepted ? FactStatus.APPLIED : FactStatus.DISMISSED,
          decidedById: userId,
          decidedAt: new Date(),
        },
      });

      if (accepted) await this.writeColumn(tx, fact.contactId, fact.field, fact.value);
    });

    this.logger.log({ message: "Fact decided", factId, decision, orgId });
    return { contactId: fact.contactId, field: fact.field, applied: accepted };
  }

  private async writeColumn(
    tx: Prisma.TransactionClient,
    contactId: string,
    field: string,
    value: string,
  ): Promise<void> {
    const column = FIELDS[field];
    if (column) {
      await tx.contact.update({ where: { id: contactId }, data: { [column]: value } });
    }
    if (field === "name") {
      const split = splitName(value);
      if (split) {
        await tx.contact.update({ where: { id: contactId }, data: split });
      }
    }
  }
}

function humanOwns(input: {
  field: string;
  column: string | null;
  contact: Record<string, unknown> & { email: string | null; firstName: string; lastName: string | null };
  hasAgentFact: boolean;
}): boolean {
  if (input.field === "name") {
    return !isDerivedName(input.contact.email, input.contact.firstName, input.contact.lastName);
  }
  if (!input.column || input.hasAgentFact) return false;
  return Boolean(input.contact[input.column]);
}

function fillsBlank(input: {
  field: string;
  column: string | null;
  contact: Record<string, unknown>;
  hasAgentFact: boolean;
}): boolean {
  if (input.hasAgentFact) return false;
  if (input.field === "name") return true;
  if (!input.column) return true;
  return !input.contact[input.column];
}

/** A name is "derived" (a placeholder from the email) rather than human-entered. */
function isDerivedName(
  email: string | null,
  firstName: string,
  lastName: string | null,
): boolean {
  if (!firstName) return true;
  if (lastName) return false; // a full name is treated as human-supplied
  if (!email) return false;
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  return local === firstName.toLowerCase();
}

function splitName(value: string): { firstName: string; lastName: string | null } | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return null;
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

const HOST_ALIASES = new Map([
  ["twitter.com", "x.com"],
  ["mobile.twitter.com", "x.com"],
]);

export function sameValue(a: string, b: string): boolean {
  return canonicalValue(a) === canonicalValue(b);
}

function canonicalValue(value: string): string {
  const text = value.trim().replace(/\s+/g, " ").toLowerCase();
  const url = asWebUrl(text);
  if (!url) return text;
  const host = url.host.replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");
  return `${HOST_ALIASES.get(host) ?? host}${path}`;
}

function asWebUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
