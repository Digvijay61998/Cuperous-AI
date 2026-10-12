import * as fc from "fast-check";
import {
  anonymousSuffix,
  cleanDetails,
  ContactRow,
  detectConflict,
  extractFromText,
  isValidEmail,
  lockKey,
  mayContainContact,
  normalizePhone,
  planFill,
  readDetails,
  splitName,
} from "./identity";
import { parseIdentityChoice, aliasField, confirmMessage } from "./identity-prompt";

describe("isValidEmail (R2.1)", () => {
  it.each([
    ["a@b.co", true],
    ["  Raj.K+x@Example.co.in ", true],
    ["a@b", false],
    ["a@.b", false],
    ["a@b.", false],
    ["a@b..c", false],
    ["@b.co", false],
    ["a b@c.co", false],
    ["a@@b.co", false],
    ["a@b@c.co", false],
    ["x".repeat(250) + "@b.co", false],
    [42, false],
  ])("%p -> %p", (v, ok) => expect(isValidEmail(v)).toBe(ok));

  it("drops platform placeholder emails", () => {
    expect(cleanDetails({ email: "visitor_abc@nomemail.com" }).email).toBeUndefined();
  });
});

describe("normalizePhone", () => {
  it.each([
    ["+91 98765 43210", "+919876543210"],
    ["(020) 555-0199", "0205550199"],
    ["98765", undefined],
    ["1234567890123456", undefined],
    ["0000000000", undefined],
    ["1111111111", undefined],
    ["call me", undefined],
    ["lift 2 floor 12345678", undefined],
    ["+91+9876543210", undefined],
  ])("%p -> %p", (v, out) => expect(normalizePhone(v)).toBe(out));
});

describe("splitName (R2.3, R2.5)", () => {
  it("splits on the first space and trims", () => {
    expect(splitName("  Raj   Kumar Sharma ")).toEqual({ firstName: "Raj", lastName: "Kumar Sharma" });
    expect(splitName("Raj")).toEqual({ firstName: "Raj", lastName: null });
  });
  it("falls back to the email local part, then Visitor", () => {
    expect(splitName("Anonymous", "raj@x.io")).toEqual({ firstName: "raj", lastName: null });
    expect(splitName("", undefined)).toEqual({ firstName: "Visitor", lastName: null });
  });
  it("caps each part at 100 characters", () => {
    const n = splitName(`${"a".repeat(150)} ${"b".repeat(150)}`);
    expect(n.firstName).toHaveLength(100);
    expect(n.lastName).toHaveLength(100);
  });
});

describe("readDetails (R2.9)", () => {
  it("uses the default aliases, or only the configured mapping", () => {
    const attrs = { contact_email: "a@b.co", my_mail: "c@d.co" };
    expect(readDetails(attrs).email).toBe("a@b.co");
    expect(readDetails(attrs, { email: "my_mail" }).email).toBe("c@d.co");
    expect(readDetails(attrs, { email: "my_mail" }).name).toBeUndefined();
  });
  it("drops invalid identifiers independently (R2.11, R2.12)", () => {
    expect(cleanDetails({ email: "bad", phone: "+91 98765 43210" })).toEqual({ phone: "+919876543210" });
    expect(cleanDetails({ email: "a@b.co", phone: "123" })).toEqual({ email: "a@b.co" });
    expect(cleanDetails({ name: "Anonymous" })).toEqual({});
  });
});

const row = (p: Partial<ContactRow> = {}): ContactRow => ({
  id: "c1",
  firstName: "Raj",
  lastName: null,
  email: null,
  phone: null,
  fieldSources: null,
  ...p,
});

describe("planFill (R2.4, R17.6, Property 2)", () => {
  it("the newest email/phone become Current (crm-plugins-service-desk R21.2)", () => {
    const plan = planFill(row({ email: "old@x.io" }), { email: "new@x.io", phone: "+15550001111" });
    expect(plan.data).toEqual({ email: "new@x.io", phone: "+15550001111", phoneNormalized: "+15550001111" });
  });

  it("the same email/phone in another format writes nothing", () => {
    const plan = planFill(row({ email: "Raj@X.io", phone: "+1 (555) 000-1111" }), { email: "raj@x.io", phone: "+15550001111" });
    expect(plan.data).toEqual({});
  });

  it("replaces a platform display name, not a person's", () => {
    expect(planFill(row({ firstName: "tg", namePlaceholder: true, fieldSources: { firstName: "chat" } }), { name: "Raj" }).data)
      .toMatchObject({ firstName: "Raj" });
  });

  it("a stated name replaces the stored one, no proposal (D11)", () => {
    const plan = planFill(row({ firstName: "Rajesh", lastName: "K" }), { name: "Raj Kumar" });
    expect(plan.data).toMatchObject({ firstName: "Raj", lastName: "Kumar" });
    expect(plan.proposals).toEqual([]);
    expect(planFill(row({ firstName: "Raj", lastName: "Kumar" }), { name: "Raj Kumar" }).data).toEqual({});
  });

  it("a guessed name only fills a blank or placeholder name (D11)", () => {
    expect(planFill(row({ firstName: "Rajesh" }), { name: "Raj", weakName: true }).data).toEqual({});
    expect(planFill(row({ firstName: "" }), { name: "Raj", weakName: true }).data).toMatchObject({ firstName: "Raj" });
    expect(planFill(row({ firstName: "Anonymous visitor", isAnonymous: true }), { name: "Raj", weakName: true }).data)
      .toMatchObject({ firstName: "Raj" });
  });

  it("replaces the placeholder name of an anonymous contact", () => {
    const plan = planFill(row({ firstName: "Anonymous visitor", lastName: "ABC123", isAnonymous: true }), { name: "Raj Kumar" });
    expect(plan.data).toMatchObject({ firstName: "Raj", lastName: "Kumar" });
  });

  it("property: a guessed name never replaces a real one; email/phone end as the newest given", () => {
    const val = fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !!s.trim()), { nil: null });
    fc.assert(
      fc.property(val, val, val, fc.record({ name: fc.option(fc.string(), { nil: undefined }), email: fc.option(fc.emailAddress(), { nil: undefined }), phone: fc.option(fc.constant("+15550001111"), { nil: undefined }) }), (fn, email, phone, d) => {
        const contact = row({ firstName: fn ?? "", email, phone });
        const clean = cleanDetails({ ...d, weakName: true });
        const plan = planFill(contact, clean);
        if (fn) expect(plan.data.firstName).toBeUndefined();
        if (clean.email) expect(plan.data.email ?? contact.email?.trim().toLowerCase()).toBe(clean.email);
        if (clean.phone) expect(plan.data.phone ?? clean.phone).toBe(clean.phone);
        if (!clean.email) expect(plan.data.email).toBeUndefined();
        if (!clean.phone) expect(plan.data.phone).toBeUndefined();
      }),
    );
  });

  it("readDetails falls back to common name attributes (R3.3)", () => {
    expect(readDetails({ name: "Raj Kumar", contact_email: "a@b.co" }, null)).toMatchObject({ name: "Raj Kumar", email: "a@b.co" });
    expect(readDetails({ contact_name: "Anonymous", full_name: "Raj" }, null).name).toBe("Raj");
    expect(readDetails({ visitor_name: "X", my_name: "Raj" }, { name: "my_name" }).name).toBe("Raj");
  });
});

describe("detectConflict (R17.2)", () => {
  it("reports a different stored phone, masked to the last 3 characters", () => {
    expect(detectConflict(row({ email: "a@b.co", phone: "+15550001234" }), { email: "a@b.co", phone: "+15550009999" })).toEqual({
      field: "phone",
      existingMasked: "•••234",
      newValue: "+15550009999",
    });
  });
  it("treats the same phone in another format as equal, and blanks as no conflict", () => {
    expect(detectConflict(row({ phone: "15550001234" }), { phone: "+1 555 000 1234" })).toBeNull();
    expect(detectConflict(row({ email: "a@b.co" }), { email: "a@b.co", phone: "+15550001234" })).toBeNull();
  });
});

describe("free text (R16.5)", () => {
  it("finds name, email and phone", () => {
    expect(extractFromText("Hi, I'm Raj Kumar, raj@x.com or +91 98765 43210")).toEqual({
      name: "Raj Kumar",
      email: "raj@x.com",
      phone: "+919876543210",
      ambiguous: false,
    });
  });
  it("does not take verbs as names", () => {
    expect(extractFromText("I'm looking for help, mail a@b.co").name).toBeUndefined();
    expect(extractFromText("I'm not sure, a@b.co").name).toBeUndefined();
  });
  it("is ambiguous with two different emails", () => {
    expect(extractFromText("a@b.co or c@d.co").ambiguous).toBe(true);
  });
  it("does not read an email's digits as a phone", () => {
    expect(extractFromText("user12345678@x.com").phone).toBeUndefined();
  });
  it("gates on @ or 7+ digits", () => {
    expect(mayContainContact("hello")).toBe(false);
    expect(mayContainContact("order 4471")).toBe(false);
    expect(mayContainContact("x@y")).toBe(true);
    expect(mayContainContact("98765 43210")).toBe(true);
  });
});

describe("misc", () => {
  it("anonymous suffix is stable and 6 characters", () => {
    expect(anonymousSuffix("conv1")).toBe(anonymousSuffix("conv1"));
    expect(anonymousSuffix("conv1")).toMatch(/^[0-9A-Z]{6}$/);
    expect(anonymousSuffix("conv1")).not.toBe(anonymousSuffix("conv2"));
  });
  it("lock keys are stable, signed 64-bit and org-scoped", () => {
    const k = lockKey("org1", "e:a@b.co");
    expect(k).toBe(lockKey("org1", "e:a@b.co"));
    expect(k).not.toBe(lockKey("org2", "e:a@b.co"));
    expect(k >= -(BigInt(2) ** BigInt(63)) && k < BigInt(2) ** BigInt(63)).toBe(true);
  });
  it("parses identity choices from buttons and words", () => {
    expect(parseIdentityChoice("Keep both")).toBe("keep_both");
    expect(parseIdentityChoice("use the new")).toBe("use_new");
    expect(parseIdentityChoice("keep existing")).toBe("keep_existing");
    expect(parseIdentityChoice("what?")).toBeNull();
  });
  it("maps aliases under the bot's mapping", () => {
    expect(aliasField("contact_email")).toBe("email");
    expect(aliasField("contact_email", { email: "mail" })).toBeNull();
    expect(aliasField("mail", { email: "mail" })).toBe("email");
  });
  it("confirm message masks identifiers", () => {
    expect(confirmMessage({ name: "Raj", email: "raj@x.com", phone: "+15550001234" }, ["name", "email", "phone"])).toBe(
      `We'll follow up with you at Raj, r•••@x.com, •••234. Is that right? Tap "Update details" to change them.`,
    );
  });
});
