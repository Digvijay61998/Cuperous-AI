/**
 * CRM plugins on the dashboard (crm-plugins-service-desk R7, R8). Pure,
 * unit-tested. The backend is the authority (it also blocks the APIs); these
 * helpers only decide what to show.
 */

export type CrmPluginKey = 'contacts' | 'service-requests' | 'companies' | 'deals' | string;

export interface CrmPlugin {
  key: CrmPluginKey;
  label: string;
  description: string;
  icon: string;
  menuPath: string;
  showInMenu: boolean;
  core: boolean;
  enabled: boolean;
  position: number;
  dependsOn: CrmPluginKey[];
  requiredBy: CrmPluginKey[];
}

export interface NavChild {
  title: string;
  path: string;
  /**
   * Role tab that may see the item (src/utils/role-tabs). Service Requests is
   * its own tab so agents see it without the rest of the CRM (R17.1, R17.2).
   */
  tab: string;
}

/** Role tab of a plugin's page. */
export const tabForPlugin = (key: CrmPluginKey) => (key === 'service-requests' ? 'service-requests' : 'crm');

/** The CRM menu before the plugin list has loaded (show, don't hide). */
export const FALLBACK_CRM_MENU: NavChild[] = [
  { title: 'Overview', path: '/crm', tab: 'crm' },
  { title: 'Contacts', path: '/crm/contacts', tab: 'crm' },
  { title: 'Service Requests', path: '/crm/service-requests', tab: 'service-requests' },
  { title: 'Companies', path: '/crm/companies', tab: 'crm' },
  { title: 'Deals', path: '/crm/deals', tab: 'crm' },
];

export const PLUGINS_MENU_ITEM: NavChild = { title: 'Plugins', path: '/crm/plugins', tab: 'crm' };

/** Org admins and managers change plugins; agents never (D2). */
export const canManagePlugins = (role?: string | null) =>
  role === 'org_admin' || role === 'org_manager' || role === 'super_admin';

/**
 * CRM sub-menu: Overview, the enabled plugins in their order, then Plugins
 * for those who may manage them (R8.1). `null` plugins = still loading or
 * unavailable: keep the old menu so nothing flickers away.
 */
export function crmMenuChildren(plugins: CrmPlugin[] | null | undefined, role?: string | null): NavChild[] {
  const manage = canManagePlugins(role);
  if (!plugins) return manage ? [...FALLBACK_CRM_MENU, PLUGINS_MENU_ITEM] : FALLBACK_CRM_MENU;
  const items = [...plugins]
    .filter((p) => p.enabled && p.showInMenu)
    .sort((a, b) => a.position - b.position)
    .map((p) => ({ title: p.label, path: p.menuPath, tab: tabForPlugin(p.key) }));
  return [{ title: 'Overview', path: '/crm', tab: 'crm' }, ...items, ...(manage ? [PLUGINS_MENU_ITEM] : [])];
}

/** Unknown (still loading) counts as on: the page asks the API, which decides. */
export function isPluginOn(plugins: CrmPlugin[] | null | undefined, key: CrmPluginKey): boolean {
  if (!plugins) return true;
  const p = plugins.find((x) => x.key === key);
  return !p || p.enabled;
}

/** Label of a plugin key for messages ("Companies"). */
export const pluginLabel = (plugins: CrmPlugin[] | null | undefined, key: CrmPluginKey) =>
  plugins?.find((p) => p.key === key)?.label ?? key;

/** Sentence for the confirm dialog when a toggle changes more than one plugin (R7.4). */
export function confirmText(
  changes: { key: CrmPluginKey; label: string; enabled: boolean }[],
  key: CrmPluginKey,
): string | null {
  const others = changes.filter((c) => c.key !== key);
  if (!others.length) return null;
  const self = changes.find((c) => c.key === key);
  const names = others.map((c) => c.label).join(', ');
  return self?.enabled === false
    ? `Turning off ${self.label} also turns off ${names}, which needs it. Their data is kept and comes back when you turn them on again.`
    : `Turning on ${self?.label ?? key} also turns on ${names}, which it needs.`;
}

/** Keys after moving one plugin up (-1) or down (+1); out-of-range moves change nothing. */
export function moveKey(plugins: CrmPlugin[], key: CrmPluginKey, delta: -1 | 1): CrmPluginKey[] {
  const keys = [...plugins].sort((a, b) => a.position - b.position).map((p) => p.key);
  const i = keys.indexOf(key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= keys.length) return keys;
  [keys[i], keys[j]] = [keys[j], keys[i]];
  return keys;
}
