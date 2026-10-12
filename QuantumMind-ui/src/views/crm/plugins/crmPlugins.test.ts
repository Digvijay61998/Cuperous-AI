import { describe, expect, it } from 'vitest';
import {
  CrmPlugin,
  confirmText,
  crmMenuChildren,
  FALLBACK_CRM_MENU,
  isPluginOn,
  moveKey,
} from './crmPlugins';

const p = (key: string, o: Partial<CrmPlugin> = {}): CrmPlugin => ({
  key,
  label: key[0].toUpperCase() + key.slice(1),
  description: '',
  icon: 'x',
  menuPath: `/crm/${key}`,
  showInMenu: true,
  core: false,
  enabled: true,
  position: 0,
  dependsOn: [],
  requiredBy: [],
  ...o,
});

const plugins = [
  p('contacts', { core: true, position: 0 }),
  p('service-requests', { label: 'Service Requests', core: true, position: 1 }),
  p('companies', { position: 2, requiredBy: ['deals'] }),
  p('deals', { position: 3, dependsOn: ['companies'] }),
];

describe('CRM plugin menu (crm-plugins-service-desk R8.1)', () => {
  it('lists Overview, enabled plugins in order, and Plugins for staff', () => {
    expect(crmMenuChildren(plugins, 'org_admin').map((c) => c.title)).toEqual([
      'Overview',
      'Contacts',
      'Service Requests',
      'Companies',
      'Deals',
      'Plugins',
    ]);
  });

  it('hides disabled plugins and the Plugins item for agents', () => {
    const off = plugins.map((x) => (x.key === 'deals' ? { ...x, enabled: false } : x));
    expect(crmMenuChildren(off, 'agent').map((c) => c.title)).toEqual(['Overview', 'Contacts', 'Service Requests', 'Companies']);
  });

  it('tags each item with its role tab (R17.1)', () => {
    const tabs = Object.fromEntries(crmMenuChildren(plugins, 'org_admin').map((c) => [c.title, c.tab]));
    expect(tabs).toEqual({
      Overview: 'crm',
      Contacts: 'crm',
      'Service Requests': 'service-requests',
      Companies: 'crm',
      Deals: 'crm',
      Plugins: 'crm',
    });
    expect(FALLBACK_CRM_MENU.find((c) => c.tab === 'service-requests')?.path).toBe('/crm/service-requests');
  });

  it('follows the configured order', () => {
    const reordered = plugins.map((x) => (x.key === 'deals' ? { ...x, position: -1 } : x));
    expect(crmMenuChildren(reordered, 'org_manager').map((c) => c.title)).toEqual([
      'Overview',
      'Deals',
      'Contacts',
      'Service Requests',
      'Companies',
      'Plugins',
    ]);
  });

  it('keeps the old menu while loading', () => {
    expect(crmMenuChildren(null, 'agent')).toEqual(FALLBACK_CRM_MENU);
    expect(crmMenuChildren(undefined, 'org_admin').map((c) => c.title)).toContain('Plugins');
    expect(isPluginOn(null, 'deals')).toBe(true);
    expect(isPluginOn(plugins.map((x) => ({ ...x, enabled: false })), 'deals')).toBe(false);
  });

  it('explains dependent changes in the confirm (R7.4)', () => {
    expect(
      confirmText(
        [
          { key: 'companies', label: 'Companies', enabled: false },
          { key: 'deals', label: 'Deals', enabled: false },
        ],
        'companies',
      ),
    ).toMatch(/Turning off Companies also turns off Deals/);
    expect(confirmText([{ key: 'deals', label: 'Deals', enabled: true }], 'deals')).toBeNull();
    expect(
      confirmText(
        [
          { key: 'deals', label: 'Deals', enabled: true },
          { key: 'companies', label: 'Companies', enabled: true },
        ],
        'deals',
      ),
    ).toMatch(/also turns on Companies/);
  });

  it('moves a plugin up or down; edges change nothing (R7.6)', () => {
    expect(moveKey(plugins, 'deals', -1)).toEqual(['contacts', 'service-requests', 'deals', 'companies']);
    expect(moveKey(plugins, 'contacts', -1)).toEqual(['contacts', 'service-requests', 'companies', 'deals']);
    expect(moveKey(plugins, 'deals', 1)).toEqual(['contacts', 'service-requests', 'companies', 'deals']);
  });
});
