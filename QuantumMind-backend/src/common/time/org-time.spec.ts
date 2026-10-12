import { COUNTRY_DEFAULT_ZONE } from "./country-zones";
import {
  defaultZoneForCountry,
  formatInOrgTz,
  isValidTimeZone,
  resolveOrgTimeZone,
} from "./org-time";

describe("org time zone", () => {
  it("every country default is a real IANA zone", () => {
    const bad = Object.entries(COUNTRY_DEFAULT_ZONE).filter(
      ([, z]) => !isValidTimeZone(z),
    );
    expect(bad).toEqual([]);
    expect(Object.keys(COUNTRY_DEFAULT_ZONE).length).toBeGreaterThan(240);
  });

  it("uses the business-capital zone for multi-zone countries", () => {
    expect(defaultZoneForCountry("AU")).toBe("Australia/Sydney");
    expect(defaultZoneForCountry("us")).toBe("America/New_York");
    expect(defaultZoneForCountry("IN")).toBe("Asia/Kolkata");
    expect(defaultZoneForCountry("FI")).toBe("Europe/Helsinki");
    expect(defaultZoneForCountry("ZZ")).toBeUndefined();
  });

  it("resolves explicit zone > country > UTC", () => {
    expect(resolveOrgTimeZone({ timeZone: "Asia/Tokyo", country: "IN" })).toBe("Asia/Tokyo");
    expect(resolveOrgTimeZone({ country: "IN" })).toBe("Asia/Kolkata");
    expect(resolveOrgTimeZone({ timeZone: "Not/AZone", country: "FI" })).toBe("Europe/Helsinki");
    expect(resolveOrgTimeZone({})).toBe("UTC");
    expect(resolveOrgTimeZone(null)).toBe("UTC");
  });

  it("formats in the org zone with a zone label", () => {
    const d = new Date("2026-10-07T15:30:00Z");
    const out = formatInOrgTz(d, { country: "IN" });
    expect(out).toContain("21:00");
    expect(out).toMatch(/GMT\+5:30|IST/);
    expect(formatInOrgTz(d, null)).toMatch(/15:30.*UTC/);
  });

  it("returns empty string for an invalid date", () => {
    expect(formatInOrgTz("not a date", null)).toBe("");
  });
});
