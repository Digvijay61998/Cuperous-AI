import { sanitizeIncidentSettings } from "./incident-settings";

describe("sanitizeIncidentSettings: closure settings (R14.5)", () => {
  it.each([
    [null, null],
    [undefined, null],
    ["", null],
    ["   ", null],
    [true, null],
    ["abc", null],
    [0, 1],
    [-3, 1],
    [7.6, 8],
    ["15", 15],
    [600, 60],
  ])("closureIdleMinutes %j -> %j (blank means the default, never 1 minute)", (input, expected) => {
    expect(sanitizeIncidentSettings({ closureIdleMinutes: input } as any).closureIdleMinutes).toBe(expected);
  });

  it("leaves an absent key absent (partial update)", () => {
    expect("closureIdleMinutes" in sanitizeIncidentSettings({ name: "x" } as any)).toBe(false);
  });

  it("trims closure texts, caps them at 500 and clears blanks to the default", () => {
    const out = sanitizeIncidentSettings({
      closurePromptText: "  Did that help?  ",
      closingMessage: "   ",
    } as any);
    expect(out.closurePromptText).toBe("Did that help?");
    expect(out.closingMessage).toBeNull();
    expect(sanitizeIncidentSettings({ closingMessage: "x".repeat(900) } as any).closingMessage).toHaveLength(500);
  });

  it("accepts the closurePrompt flag as a boolean only", () => {
    expect(sanitizeIncidentSettings({ features: { closurePrompt: "true" } } as any).features).toEqual({ closurePrompt: false });
    expect(sanitizeIncidentSettings({ features: { closurePrompt: true } } as any).features).toEqual({ closurePrompt: true });
  });
});
