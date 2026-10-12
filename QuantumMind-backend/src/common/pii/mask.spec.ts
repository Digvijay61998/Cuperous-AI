import * as fc from "fast-check";
import { MASK, maskPii, maskPiiDeep, maskPhones } from "./mask";

describe("maskPii", () => {
  it("masks emails, phones and secrets", () => {
    const out = maskPii(
      "I'm Raj, raj.kumar+kone@example.co.in, call +91 82083 23163 or (020) 555-0199. PIN 4821xz",
      { secrets: ["4821xz"] },
    );
    expect(out).toBe(
      `I'm Raj, ${MASK.email}, call ${MASK.phone} or ${MASK.phone}. PIN ${MASK.secure}`,
    );
  });

  it("leaves dates, years, short numbers and ticket refs alone", () => {
    expect(maskPhones("Order 4471 on 2026-10-08, in 2025")).toBe("Order 4471 on 2026-10-08, in 2025");
    // Documented trade-off: a 7+ digit identifier (equipment 41230018) is
    // masked as a phone; the masker prefers over-masking to leaking a phone.
    const out = maskPii("ticket SR4F9K2Q, equipment 41230018");
    expect(out).toContain("SR4F9K2Q");
    expect(out).toContain(MASK.phone);
  });

  it("keeps dates intact when they sit next to other numbers", () => {
    expect(maskPhones("visit 2026-10-07 12 people")).toBe("visit 2026-10-07 12 people");
    expect(maskPhones("from 07.10.2026 to 09.10.2026")).toBe("from 07.10.2026 to 09.10.2026");
    expect(maskPhones("on 07/10/2026 10:30, call +91 98765 43210")).toBe(
      `on 07/10/2026 10:30, call ${MASK.phone}`,
    );
    // Date followed by a phone: the date survives, the phone does not.
    const out = maskPhones("2026-10-07 020 555 0199");
    expect(out).toBe(`2026-10-07 ${MASK.phone}`);
  });

  it("does not treat date-shaped phones as dates", () => {
    expect(maskPhones("call 5550.12.34")).toBe(`call ${MASK.phone}`);
    expect(maskPhones("call 1234-56-78")).toBe(`call ${MASK.phone}`);
  });

  it("masks two adjacent phones that form one long digit run", () => {
    const out = maskPii("call 82083 23163 or 020 5550 199 today");
    expect(out.replace(/\D/g, "")).toBe("");
    expect(out).toMatch(/^call .*\[phone\].* today$/);
  });

  it("masks emails whose local part uses any RFC 5322 character", () => {
    for (const email of ["!@a.aa", "a/b@c.io", "x{y}@d.com", "o'neil@e.ie", "q=1?@f.org"]) {
      expect(maskPii(`mail ${email} now`)).toBe("mail [email] now");
    }
  });

  it("handles null/undefined and non-strings", () => {
    expect(maskPii(null)).toBe("");
    expect(maskPii(undefined)).toBe("");
  });

  it("ignores secrets shorter than 3 characters", () => {
    expect(maskPii("a b c", { secrets: ["a"] })).toBe("a b c");
  });

  it("masks nested structures", () => {
    const out = maskPiiDeep({
      chats: [{ role: "visitor", text: "mail me at a@b.io" }],
      n: 3,
      at: new Date(0),
    });
    expect(out.chats[0].text).toBe(`mail me at ${MASK.email}`);
    expect(out.n).toBe(3);
    expect(out.at).toEqual(new Date(0));
  });

  // Property 9: no original value survives masking.
  const local = fc.stringMatching(/^[a-z][a-z0-9._]{0,10}[a-z0-9]$/);
  const domain = fc.stringMatching(/^[a-z]{2,10}\.(com|io|co\.in|fi)$/);
  const email = fc.tuple(local, domain).map(([l, d]) => `${l}@${d}`);
  const phone = fc
    .tuple(fc.boolean(), fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 15 }), fc.constantFrom("", " ", "-"))
    .map(([plus, ds, sep]) => {
      // Never start with 0 after "+", and group digits with a separator.
      const digits = ds.map(String);
      if (plus && digits[0] === "0") digits[0] = "9";
      const grouped = digits.reduce((acc, d, i) => acc + (i > 0 && i % 3 === 0 ? sep : "") + d, "");
      return (plus ? "+" : "") + grouped;
    });
  const secret = fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{3,12}$/);
  const filler = fc.constantFrom("hello", "please call", "my details:", "thanks", "and");

  it("property: no email, phone or secret survives", () => {
    fc.assert(
      fc.property(fc.array(email, { maxLength: 3 }), fc.array(phone, { maxLength: 3 }), fc.array(secret, { maxLength: 3 }), filler, (emails, phones, secrets, word) => {
        const text = [word, ...emails, word, ...phones, word, ...secrets, word].join(" ");
        const out = maskPii(text, { secrets });
        for (const e of emails) expect(out).not.toContain(e);
        for (const s of secrets) expect(out.toLowerCase()).not.toContain(s.toLowerCase());
        for (const p of phones) {
          const digits = p.replace(/\D/g, "");
          expect(out.replace(/\D/g, "")).not.toContain(digits);
        }
      }),
      { numRuns: 300 },
    );
  });
});
