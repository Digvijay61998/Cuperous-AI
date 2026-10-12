/**
 * The CRM plugin catalogue (crm-plugins-service-desk R6). Pure, no I/O.
 *
 * Adding a plugin = one entry here + its module and pages (R6.5). Per-org
 * state lives in `crmPluginSetting`; a missing row means `defaultEnabled`.
 */

export type CrmPluginKey = "contacts" | "service-requests" | "companies" | "deals";

export interface CrmPluginDef {
  key: CrmPluginKey;
  label: string;
  description: string;
  /** Iconify name, as used by the dashboard. */
  icon: string;
  /** Dashboard page. */
  menuPath: string;
  /** Shown in the CRM menu (false while its pages are not built yet). */
  showInMenu: boolean;
  /** API route prefixes owned by the plugin (documentation; guarded per controller). */
  apiPrefixes: string[];
  /** Always on; cannot be turned off (R6.2). */
  core: boolean;
  defaultEnabled: boolean;
  /** Plugins that must be on for this one to work (R7.3). */
  dependsOn: CrmPluginKey[];
}

export const CRM_PLUGINS: readonly CrmPluginDef[] = [
  {
    key: "contacts",
    label: "Contacts",
    description: "Everyone who has talked to you on any channel, with their emails, phones and follow-ups.",
    icon: "bx:user",
    menuPath: "/crm/contacts",
    showInMenu: true,
    apiPrefixes: ["crm/contacts"],
    core: true,
    defaultEnabled: true,
    dependsOn: [],
  },
  {
    key: "service-requests",
    label: "Service Requests",
    description: "Customer requests raised from chat or by your team, on a board you can configure.",
    icon: "bx:task",
    menuPath: "/crm/service-requests",
    showInMenu: true,
    apiPrefixes: ["crm/service-requests", "crm/service-request-stages"],
    core: true,
    defaultEnabled: true,
    dependsOn: [],
  },
  {
    key: "companies",
    label: "Companies",
    description: "Accounts and organisations your contacts belong to.",
    icon: "bx:buildings",
    menuPath: "/crm/companies",
    showInMenu: true,
    apiPrefixes: ["crm/companies"],
    core: false,
    defaultEnabled: true,
    dependsOn: [],
  },
  {
    key: "deals",
    label: "Deals",
    description: "Your sales pipeline: stages, amounts and expected close dates. Each deal belongs to a company.",
    icon: "bx:trending-up",
    menuPath: "/crm/deals",
    showInMenu: true,
    apiPrefixes: ["crm/deals"],
    core: false,
    defaultEnabled: true,
    dependsOn: ["companies"],
  },
];

const BY_KEY = new Map<string, CrmPluginDef>(CRM_PLUGINS.map((p) => [p.key, p]));

export const isPluginKey = (key: unknown): key is CrmPluginKey => typeof key === "string" && BY_KEY.has(key);
export const pluginDef = (key: CrmPluginKey): CrmPluginDef => BY_KEY.get(key)!;

export interface StoredSetting {
  key: string;
  enabled: boolean;
  position: number;
}

export interface PluginState {
  key: CrmPluginKey;
  enabled: boolean;
  position: number;
}

/**
 * Effective state per plugin: stored rows over registry defaults, unknown
 * keys ignored (R6.3, R6.4), core always on. Sorted by position, then
 * registry order. Repairs a stored state that breaks a dependency (an
 * enabled plugin whose dependency is off is reported off).
 */
export function effectiveStates(rows: StoredSetting[]): PluginState[] {
  const stored = new Map(rows.filter((r) => isPluginKey(r.key)).map((r) => [r.key, r]));
  const states = CRM_PLUGINS.map((def, index) => {
    const row = stored.get(def.key);
    return {
      key: def.key,
      enabled: def.core ? true : row ? row.enabled : def.defaultEnabled,
      position: row ? row.position : index,
      index,
    };
  });
  const on = new Set(states.filter((s) => s.enabled).map((s) => s.key));
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of states) {
      if (s.enabled && pluginDef(s.key).dependsOn.some((d) => !on.has(d))) {
        s.enabled = false;
        on.delete(s.key);
        changed = true;
      }
    }
  }
  return states
    .sort((a, b) => a.position - b.position || a.index - b.index)
    .map(({ key, enabled, position }) => ({ key, enabled, position }));
}

/** Plugins that depend on `key`, directly or through another plugin. */
export function dependentsOf(key: CrmPluginKey): CrmPluginKey[] {
  const out = new Set<CrmPluginKey>();
  const walk = (k: CrmPluginKey) => {
    for (const p of CRM_PLUGINS) {
      if (p.dependsOn.includes(k) && !out.has(p.key)) {
        out.add(p.key);
        walk(p.key);
      }
    }
  };
  walk(key);
  return [...out];
}

/** Dependencies of `key`, transitively. */
export function dependenciesOf(key: CrmPluginKey): CrmPluginKey[] {
  const out = new Set<CrmPluginKey>();
  const walk = (k: CrmPluginKey) => {
    for (const d of pluginDef(k).dependsOn) {
      if (!out.has(d)) {
        out.add(d);
        walk(d);
      }
    }
  };
  walk(key);
  return [...out];
}

export class CorePluginError extends Error {}

/**
 * The changes one toggle makes (R7.3, R7.4): enabling also enables every
 * dependency; disabling also disables every enabled dependent. Core
 * plugins cannot be disabled. Returns only plugins whose state changes.
 */
export function planToggle(
  states: PluginState[],
  key: CrmPluginKey,
  enabled: boolean,
): { key: CrmPluginKey; enabled: boolean }[] {
  const def = pluginDef(key);
  if (def.core && !enabled) throw new CorePluginError(`${def.label} is part of the CRM and cannot be turned off.`);
  const current = new Map(states.map((s) => [s.key, s.enabled]));
  const affected = enabled ? [key, ...dependenciesOf(key)] : [key, ...dependentsOf(key)];
  return affected
    .filter((k) => current.get(k) !== enabled && !(pluginDef(k).core && !enabled))
    .map((k) => ({ key: k, enabled }));
}

/**
 * New positions after the admin orders `keys` (R7.6). Unknown and repeated
 * keys are ignored; plugins not mentioned keep their relative order after
 * the mentioned ones.
 */
export function planOrder(states: PluginState[], keys: string[]): Map<CrmPluginKey, number> {
  const seen = new Set<CrmPluginKey>();
  const ordered: CrmPluginKey[] = [];
  for (const k of keys) if (isPluginKey(k) && !seen.has(k)) ordered.push(k), seen.add(k);
  for (const s of states) if (!seen.has(s.key)) ordered.push(s.key);
  return new Map(ordered.map((k, i) => [k, i]));
}
