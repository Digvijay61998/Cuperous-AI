import * as fc from "fast-check";
import {
  CorePluginError,
  CRM_PLUGINS,
  CrmPluginKey,
  dependentsOf,
  effectiveStates,
  planOrder,
  planToggle,
  pluginDef,
} from "./plugin-registry";

const KEYS = CRM_PLUGINS.map((p) => p.key);
const apply = (states: any[], changes: { key: CrmPluginKey; enabled: boolean }[]) =>
  states.map((s) => {
    const c = changes.find((x) => x.key === s.key);
    return c ? { ...s, enabled: c.enabled } : s;
  });

describe("CRM plugin registry (crm-plugins-service-desk R6, R7)", () => {
  it("defaults: everything on, registry order (R6.3, D3)", () => {
    expect(effectiveStates([])).toEqual(KEYS.map((key, position) => ({ key, enabled: true, position })));
  });

  it("ignores unknown stored keys and never turns a core plugin off (R6.4)", () => {
    const states = effectiveStates([
      { key: "contacts", enabled: false, position: 9 },
      { key: "invoices", enabled: true, position: 0 },
    ]);
    expect(states.map((s) => s.key)).toEqual(["service-requests", "companies", "deals", "contacts"]);
    expect(states.find((s) => s.key === "contacts")!.enabled).toBe(true);
  });

  it("repairs a stored state that breaks a dependency (deals on, companies off)", () => {
    const states = effectiveStates([{ key: "companies", enabled: false, position: 2 }]);
    expect(states.find((s) => s.key === "deals")!.enabled).toBe(false);
  });

  it("enabling Deals also enables Companies; disabling Companies also disables Deals (R7.3, R7.4)", () => {
    const off = effectiveStates([
      { key: "companies", enabled: false, position: 2 },
      { key: "deals", enabled: false, position: 3 },
    ]);
    expect(planToggle(off, "deals", true)).toEqual([
      { key: "deals", enabled: true },
      { key: "companies", enabled: true },
    ]);
    expect(planToggle(effectiveStates([]), "companies", false)).toEqual([
      { key: "companies", enabled: false },
      { key: "deals", enabled: false },
    ]);
    expect(dependentsOf("companies")).toEqual(["deals"]);
  });

  it("refuses to turn a core plugin off; turning it on is a no-op", () => {
    expect(() => planToggle(effectiveStates([]), "contacts", false)).toThrow(CorePluginError);
    expect(planToggle(effectiveStates([]), "service-requests", true)).toEqual([]);
  });

  // Property 3: no sequence of toggles leaves an enabled plugin without its dependency.
  it("property: dependency closure holds after any toggles", () => {
    const optional = CRM_PLUGINS.filter((p) => !p.core).map((p) => p.key);
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.constantFrom(...optional), fc.boolean()), { maxLength: 20 }), (ops) => {
        let states = effectiveStates([]);
        for (const [key, enabled] of ops) states = apply(states, planToggle(states, key, enabled));
        const on = new Set(states.filter((s) => s.enabled).map((s) => s.key));
        for (const s of states) {
          if (pluginDef(s.key).core) expect(s.enabled).toBe(true);
          if (s.enabled) for (const dep of pluginDef(s.key).dependsOn) expect(on.has(dep)).toBe(true);
        }
        // The stored rows re-read give the same states.
        expect(effectiveStates(states).map((s) => [s.key, s.enabled])).toEqual(states.map((s) => [s.key, s.enabled]));
      }),
    );
  });

  it("orders: given keys first, unknown and repeated keys ignored, the rest keep their order (R7.6)", () => {
    const pos = planOrder(effectiveStates([]), ["deals", "x", "deals", "contacts"]);
    expect([...pos.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k)).toEqual([
      "deals",
      "contacts",
      "service-requests",
      "companies",
    ]);
  });
});
