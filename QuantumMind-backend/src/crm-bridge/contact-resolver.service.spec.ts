import * as fc from "fast-check";
import { ContactResolverService, mergeProfiles } from "./contact-resolver.service";
import { cleanDetails } from "./identity";

/**
 * In-memory stand-in for the CRM Prisma client with the semantics the
 * resolver relies on: transactions, `pg_advisory_xact_lock` as a real
 * per-key async mutex held until the transaction ends, case-insensitive
 * email lookup, and the partial unique index on lower(email) for active
 * contacts. Every call yields, so concurrent resolves interleave.
 */
function fakeCrm() {
  const contacts: any[] = [];
  const activities: any[] = [];
  const facts: any[] = [];
  const identifiers: any[] = [];
  const dealContacts: any[] = [];
  const locks = new Map<string, Promise<void>>();
  let seq = 0;
  const tick = () => new Promise((r) => setImmediate(r));

  const active = (c: any) => c.archivedAt == null;
  const matchContact = (c: any, w: any): boolean =>
    Object.entries(w).every(([k, v]: [string, any]) => {
      if (k === "email" && v && typeof v === "object") return (c.email ?? "").toLowerCase() === v.equals.toLowerCase();
      if (v && typeof v === "object" && "path" in v) return c[k]?.[v.path[0]] === v.equals;
      if (v === null) return c[k] == null;
      return c[k] === v;
    });
  const uniqueEmail = (c: any) => {
    if (!c.email || !active(c)) return;
    if (contacts.some((x) => x !== c && active(x) && x.organizationId === c.organizationId && x.email?.toLowerCase() === c.email.toLowerCase())) {
      throw Object.assign(new Error("P2002"), { code: "P2002" });
    }
  };
  const pick = (c: any) => (c ? { ...c, visitorIds: [...(c.visitorIds || [])] } : null);

  const client = (held: string[]) => ({
    $executeRaw: async (_s: TemplateStringsArray, key: bigint) => {
      const k = String(key);
      while (locks.has(k) && !held.includes(k)) await locks.get(k);
      if (!held.includes(k)) {
        let release!: () => void;
        locks.set(k, new Promise<void>((r) => (release = r)));
        (locks.get(k) as any).release = release;
        held.push(k);
      }
      return 1;
    },
    $queryRaw: async (_s: TemplateStringsArray, orgId: string, key: string) => {
      await tick();
      const digits = (v: any) => String(v ?? "").replace(/\D/g, "");
      return contacts
        .filter((c) => c.organizationId === orgId && active(c) && (digits(c.phoneNormalized) === key || digits(c.phone) === key))
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, 1)
        .map((c) => ({ id: c.id }));
    },
    contact: {
      findFirst: async ({ where, orderBy }: any) => {
        await tick();
        let rows = contacts.filter((c) => matchContact(c, where));
        if (orderBy?.createdAt) rows = rows.sort((a, b) => a.createdAt - b.createdAt);
        return pick(rows[0]);
      },
      create: async ({ data }: any) => {
        await tick();
        const c = { visitorIds: [], isAnonymous: false, archivedAt: null, ...data, id: `c${++seq}`, createdAt: seq };
        contacts.push(c);
        try {
          uniqueEmail(c);
        } catch (e) {
          contacts.pop();
          throw e;
        }
        return { id: c.id };
      },
      update: async ({ where, data }: any) => {
        await tick();
        const c = contacts.find((x) => x.id === where.id);
        const before = { ...c };
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && !Array.isArray(v) && "push" in (v as any)) c[k] = [...(c[k] || []), (v as any).push];
          else c[k] = v;
        }
        try {
          uniqueEmail(c);
        } catch (e) {
          Object.assign(c, before);
          throw e;
        }
        return pick(c);
      },
    },
    activity: {
      findFirst: async ({ where }: any) => {
        await tick();
        const [key, val] = [where.meta.path[0], where.meta.equals];
        return activities.find((a) => a.organizationId === where.organizationId && a.contactId === where.contactId && a.meta?.[key] === val) ?? null;
      },
      create: async ({ data }: any) => {
        await tick();
        activities.push({ ...data, id: `a${activities.length}` });
      },
      updateMany: async ({ where, data }: any) => {
        for (const a of activities) if (a.contactId === where.contactId) Object.assign(a, data);
      },
    },
    contactFact: {
      findFirst: async ({ where }: any) =>
        facts.find((f) => f.contactId === where.contactId && f.field === where.field && f.value === where.value) ?? null,
      create: async ({ data }: any) => {
        facts.push(data);
      },
    },
    // Unique (organizationId, kind, value), like the real table.
    contactIdentifier: {
      findFirst: async ({ where }: any) => {
        await tick();
        const row = identifiers.find(
          (i) => i.organizationId === where.organizationId && i.kind === where.kind && i.value === where.value,
        );
        if (!row) return null;
        const owner = contacts.find((c) => c.id === row.contactId);
        if (where.contact?.archivedAt === null && (!owner || !active(owner))) return null;
        return { ...row, contact: pick(owner) };
      },
      // INSERT … ON CONFLICT DO NOTHING on the unique key.
      createMany: async ({ data, skipDuplicates }: any) => {
        await tick();
        let count = 0;
        for (const row of data) {
          const dup = identifiers.some((i) => i.organizationId === row.organizationId && i.kind === row.kind && i.value === row.value);
          if (dup && !skipDuplicates) throw Object.assign(new Error("P2002"), { code: "P2002" });
          if (dup) continue;
          identifiers.push({ ...row, id: `i${identifiers.length}` });
          count++;
        }
        return { count };
      },
      update: async ({ where, data }: any) => {
        await tick();
        Object.assign(identifiers.find((i) => i.id === where.id), data);
      },
      updateMany: async ({ where, data }: any) => {
        for (const i of identifiers) if (i.organizationId === where.organizationId && i.contactId === where.contactId) Object.assign(i, data);
      },
    },
    dealContact: {
      findMany: async ({ where }: any) => dealContacts.filter((x) => x.contactId === where.contactId),
      findFirst: async ({ where }: any) => dealContacts.find((x) => x.dealId === where.dealId && x.contactId === where.contactId) ?? null,
      delete: async ({ where }: any) => {
        const k = where.dealId_contactId;
        dealContacts.splice(dealContacts.findIndex((x) => x.dealId === k.dealId && x.contactId === k.contactId), 1);
      },
      update: async ({ where, data }: any) => {
        const k = where.dealId_contactId;
        Object.assign(dealContacts.find((x) => x.dealId === k.dealId && x.contactId === k.contactId), data);
      },
    },
  });

  const root = {
    ...client([]),
    $transaction: async (fn: any) => {
      const held: string[] = [];
      try {
        return await fn(client(held));
      } finally {
        for (const k of held) {
          const p: any = locks.get(k);
          locks.delete(k);
          p?.release?.();
        }
      }
    },
  };
  return { contacts, activities, facts, identifiers, dealContacts, crm: { forOrg: () => root } as any };
}

const ORG = "org1";
const d = (x: any) => cleanDetails(x);

describe("ContactResolverService", () => {
  it("creates a chat contact with split name, lower-case email and normalised phone", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const out = await svc.resolve(ORG, { details: d({ name: "Raj Kumar", email: " Raj@X.com ", phone: "+91 98765 43210" }) });
    expect(out).toMatchObject({ kind: "linked", created: true });
    expect(f.contacts[0]).toMatchObject({
      firstName: "Raj",
      lastName: "Kumar",
      email: "raj@x.com",
      phone: "+919876543210",
      phoneNormalized: "+919876543210",
      source: "CHAT",
    });
  });

  it("creates nothing without a valid identifier (R2.6)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    expect(await svc.resolve(ORG, { details: d({ name: "Raj", email: "nope" }) })).toEqual({ kind: "none" });
    expect(f.contacts).toHaveLength(0);
  });

  it("matches by email first, then by phone in any format, earliest wins (R2.2, R2.10)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push(
      { id: "old", organizationId: ORG, firstName: "A", email: null, phone: "(555) 000-1234", createdAt: -2, archivedAt: null, visitorIds: [] },
      { id: "new", organizationId: ORG, firstName: "B", email: null, phone: "5550001234", createdAt: -1, archivedAt: null, visitorIds: [] },
    );
    const out = await svc.resolve(ORG, { details: d({ phone: "555 000 1234" }) });
    expect(out).toMatchObject({ kind: "linked", contactId: "old", created: false });
  });

  it("ignores archived and other-org contacts", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push(
      { id: "arch", organizationId: ORG, firstName: "A", email: "a@b.co", createdAt: -2, archivedAt: new Date(), visitorIds: [] },
      { id: "other", organizationId: "org2", firstName: "A", email: "a@b.co", createdAt: -1, archivedAt: null, visitorIds: [] },
    );
    const out = await svc.resolve(ORG, { details: d({ email: "a@b.co" }) });
    expect(out).toMatchObject({ created: true });
  });

  // Property 1: one active contact per email/phone under any interleaving.
  it("property: concurrent captures of the same person create exactly one contact", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("email", "phone", "both"), { minLength: 2, maxLength: 6 }),
        async (shapes) => {
          const f = fakeCrm();
          const svc = new ContactResolverService(f.crm);
          const all = { email: "raj@x.com", phone: "+919876543210", name: "Raj" };
          await Promise.all(
            shapes.map((s) =>
              svc.resolve(ORG, {
                details: d(s === "email" ? { email: all.email } : s === "phone" ? { phone: all.phone } : all),
                noConflictPrompt: true,
              }),
            ),
          );
          const active = f.contacts.filter((c) => !c.archivedAt);
          // Email-only and phone-only captures can each create before the other
          // identifier is known; what must never happen is two rows sharing an
          // identifier.
          const emails = active.filter((c) => c.email === all.email);
          const phones = active.filter((c) => c.phoneNormalized === all.phone || c.phone === all.phone);
          expect(emails.length).toBeLessThanOrEqual(1);
          expect(phones.length).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 40 },
    );
  });

  it("property: N concurrent identical captures -> one contact", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 8 }), async (n) => {
        const f = fakeCrm();
        const svc = new ContactResolverService(f.crm);
        const outs = await Promise.all(
          Array.from({ length: n }, () => svc.resolve(ORG, { details: d({ email: "Raj@x.com", phone: "+919876543210" }) })),
        );
        expect(f.contacts).toHaveLength(1);
        expect(new Set(outs.map((o: any) => o.contactId)).size).toBe(1);
      }),
      { numRuns: 25 },
    );
  });

  it("on a match a stated name replaces the stored one; a guessed one does not (D11)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push({ id: "c", organizationId: ORG, firstName: "Rajesh", lastName: "K", email: "raj@x.com", phone: null, createdAt: 0, archivedAt: null, visitorIds: [] });
    await svc.resolve(ORG, { details: d({ name: "Raj Kumarr", email: "raj@x.com", weakName: true }) });
    expect(f.contacts[0]).toMatchObject({ firstName: "Rajesh", lastName: "K" });
    await svc.resolve(ORG, { details: d({ name: "Raj Kumar", email: "raj@x.com", phone: "+919876543210" }) });
    expect(f.contacts[0]).toMatchObject({ firstName: "Raj", lastName: "Kumar", phone: "+919876543210" });
    expect(f.facts).toEqual([]);
  });

  it("a different phone becomes Current and the old one is kept, no question (R21.2)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    // A row from before identifiers existed: no identifier rows yet.
    f.contacts.push({ id: "c", organizationId: ORG, firstName: "Raj", email: "raj@x.com", phone: "+15550001234", createdAt: 0, archivedAt: null, visitorIds: [] });
    const out = await svc.resolve(ORG, { details: d({ email: "raj@x.com", phone: "+15550009999" }), source: "widget_chat" });
    expect(out).toEqual({ kind: "linked", contactId: "c", created: false });
    expect(f.contacts[0]).toMatchObject({ phone: "+15550009999", phoneNormalized: "+15550009999" });
    const phones = f.identifiers.filter((i) => i.kind === "PHONE").map((i) => [i.value, i.contactId]);
    expect(phones.sort()).toEqual([["15550001234", "c"], ["15550009999", "c"]]);
    // The old phone still finds the same person (R21.1), and makes it Current again (R21.3).
    expect(await svc.resolve(ORG, { details: d({ phone: "+1 555 000 1234" }) })).toMatchObject({ contactId: "c", created: false });
    expect(f.contacts[0].phone).toBe("+15550001234");
    expect(f.contacts.filter((c) => !c.archivedAt)).toHaveLength(1);
  });

  it("a different email on a phone match becomes Current; the old email still matches (R21.1, R21.2)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    await svc.resolve(ORG, { details: d({ name: "Raj", email: "old@x.com", phone: "+919876543210" }) });
    await svc.resolve(ORG, { details: d({ email: "new@x.com", phone: "+919876543210" }) });
    expect(f.contacts).toHaveLength(1);
    expect(f.contacts[0].email).toBe("new@x.com");
    expect(f.identifiers.filter((i) => i.kind === "EMAIL").map((i) => i.value).sort()).toEqual(["new@x.com", "old@x.com"]);
    expect(await svc.resolve(ORG, { details: d({ email: "OLD@x.com" }) })).toMatchObject({ contactId: f.contacts[0].id, created: false });
    expect(f.contacts).toHaveLength(1);
  });

  it("records the capture source on a created contact and its identifiers (R5.1)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    await svc.resolve(ORG, { details: d({ email: "raj@x.com" }), source: "widget_form" });
    await svc.resolve(ORG, { details: d({ email: "raj@x.com" }), source: "whatsapp" });
    expect(f.contacts[0].sourceChannel).toBe("widget_form");
    expect(f.identifiers[0].source).toBe("whatsapp");
  });

  it("platform-only lead: created from a Telegram id, matched again by it (R22.3)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const tg = { kind: "TELEGRAM", value: "123456789" };
    const a = (await svc.resolve(ORG, { details: d({ name: "Raj K", channel: tg }), source: "telegram" })) as any;
    expect(a).toMatchObject({ kind: "linked", created: true });
    expect(f.contacts[0]).toMatchObject({ firstName: "Raj", lastName: "K", email: null, phone: null, sourceChannel: "telegram" });
    const b = (await svc.resolve(ORG, { details: d({ name: "Raj K", channel: tg }) })) as any;
    expect(b).toMatchObject({ contactId: a.contactId, created: false });
    expect(f.contacts).toHaveLength(1);
  });

  it("rejects malformed platform ids", () => {
    expect(d({ channel: { kind: "TELEGRAM", value: "@raj" } }).channel).toBeUndefined();
    expect(d({ channel: { kind: "WHATSAPP_LID", value: "123" } }).channel).toBeUndefined();
    expect(d({ channel: { kind: "OTHER", value: "1" } }).channel).toBeUndefined();
    expect(d({ channel: { kind: "FACEBOOK", value: 2468 } }).channel).toEqual({ kind: "FACEBOOK", value: "2468" });
  });

  it("platform-only lead gives an email that belongs to someone: merged into them (R22.4)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push({ id: "known", organizationId: ORG, firstName: "Rajesh", email: "raj@x.com", createdAt: -1, archivedAt: null, visitorIds: ["v0"] });
    const { contactId: lead } = (await svc.resolve(ORG, {
      details: d({ name: "Raj", channel: { kind: "FACEBOOK", value: "psid-1" } }),
    })) as any;
    f.dealContacts.push({ organizationId: ORG, dealId: "d1", contactId: lead });
    const out = await svc.resolve(ORG, { details: d({ email: "raj@x.com" }), currentContactId: lead });
    expect(out).toMatchObject({ kind: "linked", contactId: "known", merged: true });
    expect(f.contacts.find((c) => c.id === lead).archivedAt).toBeInstanceOf(Date);
    expect(f.identifiers.find((i) => i.kind === "FACEBOOK").contactId).toBe("known");
    expect(f.dealContacts[0].contactId).toBe("known");
    // The person's own name is kept.
    expect(f.contacts.find((c) => c.id === "known").firstName).toBe("Rajesh");
    // The Messenger id now finds the merged contact.
    expect(await svc.resolve(ORG, { details: d({ channel: { kind: "FACEBOOK", value: "psid-1" } }) })).toMatchObject({ contactId: "known" });
  });

  it("platform-only lead upgraded in place when nobody else matches; its placeholder name can change", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const { contactId } = (await svc.resolve(ORG, {
      details: d({ name: "tg user", channel: { kind: "TELEGRAM", value: "42" } }),
    })) as any;
    await svc.resolve(ORG, { details: d({ name: "Raj Kumar", phone: "+919876543210" }), currentContactId: contactId });
    expect(f.contacts).toHaveLength(1);
    expect(f.contacts[0]).toMatchObject({ firstName: "Raj", lastName: "Kumar", phone: "+919876543210" });
  });

  it("a contact a person works on is not a placeholder and is never merged away", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const { contactId: lead } = (await svc.resolve(ORG, {
      details: d({ name: "Raj", channel: { kind: "TELEGRAM", value: "7" } }),
    })) as any;
    f.contacts[0].ownerId = "user1"; // a rep picked the lead up
    f.contacts.push({ id: "known", organizationId: ORG, firstName: "R", email: "raj@x.com", createdAt: 99, archivedAt: null, visitorIds: [] });
    await svc.resolve(ORG, { details: d({ email: "raj@x.com" }), currentContactId: lead });
    expect(f.contacts.every((c) => !c.archivedAt)).toBe(true);
  });

  it("an identifier of an archived contact is taken over, never duplicated (R21.5)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const { contactId: first } = (await svc.resolve(ORG, { details: d({ email: "raj@x.com" }) })) as any;
    f.contacts[0].archivedAt = new Date();
    const out = (await svc.resolve(ORG, { details: d({ email: "raj@x.com" }) })) as any;
    expect(out.created).toBe(true);
    expect(out.contactId).not.toBe(first);
    expect(f.identifiers).toHaveLength(1);
    expect(f.identifiers[0].contactId).toBe(out.contactId);
  });

  it("fillName names an anonymous contact but keeps it anonymous; a stated name replaces, a guess does not (R1.6, D11)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const anon = await svc.createAnonymous(ORG, "conv1", "v1");
    expect(await svc.fillName(ORG, anon, "Raj Kumar")).toBe(true);
    expect(f.contacts[0]).toMatchObject({ firstName: "Raj", lastName: "Kumar", isAnonymous: true });
    f.contacts.push({ id: "h", organizationId: ORG, firstName: "Rajesh", lastName: null, createdAt: 5, archivedAt: null, visitorIds: [], fieldSources: null });
    expect(await svc.fillName(ORG, "h", "Raj", { weakName: true })).toBe(false);
    expect(f.contacts[1].firstName).toBe("Rajesh");
    expect(await svc.fillName(ORG, "h", "Raj")).toBe(true);
    expect(f.contacts[1].firstName).toBe("Raj");
    expect(await svc.fillName(ORG, "h", "Raj")).toBe(false); // same name: no write
  });

  // Property 1 across identifiers: no email, phone or platform id ever has two active owners.
  it("property: concurrent mixed captures never give one identifier two active contacts", async () => {
    const tg = { kind: "TELEGRAM", value: "555" };
    const shapes = fc.constantFrom<any>(
      { email: "a@x.com" },
      { phone: "+919876543210" },
      { channel: tg },
      { email: "b@x.com", phone: "+919876543210" },
      { email: "a@x.com", channel: tg },
      { phone: "+919876543210", channel: tg },
    );
    await fc.assert(
      fc.asyncProperty(fc.array(shapes, { minLength: 2, maxLength: 6 }), async (caps) => {
        const f = fakeCrm();
        const svc = new ContactResolverService(f.crm);
        await Promise.all(caps.map((c: any) => svc.resolve(ORG, { details: d(c) })));
        const activeIds = new Set(f.contacts.filter((c) => !c.archivedAt).map((c) => c.id));
        const owners = new Map<string, Set<string>>();
        for (const i of f.identifiers) {
          if (!activeIds.has(i.contactId)) continue;
          const k = `${i.kind}:${i.value}`;
          owners.set(k, (owners.get(k) ?? new Set()).add(i.contactId));
        }
        for (const s of owners.values()) expect(s.size).toBe(1);
        const emailCols = f.contacts.filter((c) => !c.archivedAt && c.email).map((c) => c.email);
        expect(new Set(emailCols).size).toBe(emailCols.length);
      }),
      { numRuns: 100 },
    );
  });

  it("applies Keep both / Use new / Keep existing (R17.3)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push({ id: "c", organizationId: ORG, firstName: "Raj", phone: "+15550001234", fieldSources: { phone: "chat" }, createdAt: 0, archivedAt: null, visitorIds: [] });
    const conflict = { field: "phone" as const, newValue: "+15550009999" };
    await svc.applyConflictChoice(ORG, "c", conflict, "keep_existing");
    expect(f.contacts[0].phone).toBe("+15550001234");
    await svc.applyConflictChoice(ORG, "c", conflict, "keep_both");
    expect(f.contacts[0].altIdentifiers).toEqual({ phones: ["+15550009999"] });
    // Kept-both values are no longer conflicts.
    expect(await svc.resolve(ORG, { details: d({ phone: "+15550001234", email: undefined }) })).toMatchObject({ kind: "linked" });
    await svc.applyConflictChoice(ORG, "c", conflict, "use_new");
    expect(f.contacts[0].phone).toBe("+15550009999");
  });

  it("Use new on a person-owned field becomes a proposal (R17.6)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push({ id: "c", organizationId: ORG, firstName: "Raj", phone: "+15550001234", fieldSources: null, createdAt: 0, archivedAt: null, visitorIds: [] });
    await svc.applyConflictChoice(ORG, "c", { field: "phone", newValue: "+15550009999" }, "use_new");
    expect(f.contacts[0].phone).toBe("+15550001234");
    expect(f.facts).toHaveLength(1);
  });

  it("email and phone on two people: links to the email match, suggests merge on both (R17.4)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    f.contacts.push(
      { id: "e", organizationId: ORG, firstName: "A", email: "raj@x.com", createdAt: 0, archivedAt: null, visitorIds: [] },
      { id: "p", organizationId: ORG, firstName: "B", phone: "+919876543210", createdAt: 1, archivedAt: null, visitorIds: [] },
    );
    const input = { details: d({ email: "raj@x.com", phone: "+919876543210" }) };
    expect(await svc.resolve(ORG, input)).toMatchObject({ kind: "linked", contactId: "e" });
    await svc.resolve(ORG, input);
    expect(f.activities.filter((a) => a.meta.kind === "merge_suggestion").map((a) => a.contactId).sort()).toEqual(["e", "p"]);
  });

  it("anonymous: idempotent per conversation, upgraded in place, merged into a match (R20)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const a1 = await svc.createAnonymous(ORG, "conv1", "v1");
    expect(await svc.createAnonymous(ORG, "conv1", "v1")).toBe(a1);
    expect(f.contacts[0]).toMatchObject({ firstName: "Anonymous visitor", isAnonymous: true, visitorIds: ["v1"] });

    // Upgrade in place when nobody else matches.
    await svc.resolve(ORG, { details: d({ name: "Raj Kumar", email: "raj@x.com" }), currentContactId: a1 });
    expect(f.contacts[0]).toMatchObject({ id: a1, isAnonymous: false, firstName: "Raj", email: "raj@x.com" });

    // A second anonymous contact that turns out to be Raj is merged.
    const a2 = await svc.createAnonymous(ORG, "conv2", "v2");
    await f.crm.forOrg().activity.create({ data: { organizationId: ORG, contactId: a2, meta: { kind: "note" } } });
    const out = await svc.resolve(ORG, { details: d({ email: "raj@x.com" }), currentContactId: a2 });
    expect(out).toMatchObject({ kind: "linked", contactId: a1, merged: true });
    const anon = f.contacts.find((c) => c.id === a2);
    expect(anon.archivedAt).toBeInstanceOf(Date);
    expect(f.contacts.find((c) => c.id === a1).visitorIds.sort()).toEqual(["v1", "v2"]);
    expect(f.activities.every((a) => a.contactId !== a2)).toBe(true);
  });

  it("recordLink adds the visitor once and one chat_linked activity per conversation (R3.1, R3.2, R3.9)", async () => {
    const f = fakeCrm();
    const svc = new ContactResolverService(f.crm);
    const { contactId } = (await svc.resolve(ORG, { details: d({ email: "raj@x.com" }) })) as any;
    const link = { conversationId: "conv1", visitorId: "v1", botName: "Bot", channel: "widget" };
    await Promise.all([svc.recordLink(ORG, contactId, link), svc.recordLink(ORG, contactId, link), svc.recordLink(ORG, contactId, link)]);
    expect(f.contacts[0].visitorIds).toEqual(["v1"]);
    expect(f.activities.filter((a) => a.meta.kind === "chat_linked")).toHaveLength(1);
  });
});

describe("mergeProfiles", () => {
  it("unions entries newest first and keeps target facts", () => {
    const out = mergeProfiles(
      { v: 1, facts: { language: "en" }, entries: [{ at: "2026-10-05", summary: "b" }] },
      { v: 1, facts: { language: "fi", products: ["x"] }, entries: [{ at: "2026-10-07", summary: "a" }, { at: "2026-10-05", summary: "b" }] },
    );
    expect(out.entries.map((e: any) => e.summary)).toEqual(["a", "b"]);
    expect(out.facts).toEqual({ language: "en", products: ["x"] });
    expect(mergeProfiles(null, null)).toBeUndefined();
  });
});
