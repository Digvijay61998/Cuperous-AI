import { BOT_FEATURE_KEYS, isFeatureOn } from "./features";

// Retired switches: the behaviour is on for every bot, whatever is stored.
const ALWAYS_ON = ["incidentHandover"];

describe("isFeatureOn", () => {
  it.each(BOT_FEATURE_KEYS.filter((k) => !ALWAYS_ON.includes(k)))("is off by default for %s", (key) => {
    expect(isFeatureOn(undefined, key)).toBe(false);
    expect(isFeatureOn(null, key)).toBe(false);
    expect(isFeatureOn({}, key)).toBe(false);
    expect(isFeatureOn({ features: {} }, key)).toBe(false);
  });
  it("incidentHandover is always on (incident first), even when stored off", () => {
    expect(isFeatureOn(undefined, "incidentHandover")).toBe(true);
    expect(isFeatureOn({ features: { incidentHandover: false } }, "incidentHandover")).toBe(true);
  });
  it("is on only for literal true", () => {
    expect(isFeatureOn({ features: { closurePrompt: true } }, "closurePrompt")).toBe(true);
    for (const v of ["true", 1, "yes", {}, null, false]) {
      expect(isFeatureOn({ features: { closurePrompt: v } } as any, "closurePrompt")).toBe(false);
    }
  });
  it("flags are independent", () => {
    const s = { features: { closurePrompt: true } };
    expect(isFeatureOn(s, "closurePrompt")).toBe(true);
    expect(isFeatureOn(s, "autoLearn")).toBe(false);
  });
});
