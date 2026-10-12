import { describe, expect, it } from 'vitest';
import { canAccessPath } from 'src/helper/Access';
import { tabForPath } from 'src/utils/role-tabs';
import { CrmPlugin } from 'src/views/crm/plugins/crmPlugins';
import navigation from './index';

const p = (key: string, label: string, position: number, o: Partial<CrmPlugin> = {}): CrmPlugin => ({
  key,
  label,
  description: '',
  icon: 'x',
  menuPath: `/crm/${key}`,
  showInMenu: true,
  core: false,
  enabled: true,
  position,
  dependsOn: [],
  requiredBy: [],
  ...o,
});
const plugins = [
  p('contacts', 'Contacts', 0, { core: true }),
  p('service-requests', 'Service Requests', 1, { core: true }),
  p('companies', 'Companies', 2),
  p('deals', 'Deals', 3),
];

const titles = (items: any[]) => items.map((i) => i.title);
const crm = (items: any[]) => items.find((i) => i.title === 'CRM');

describe('Service Requests in the CRM menu (R17.1–R17.3, R17.5)', () => {
  it('agents see CRM with only Service Requests', () => {
    for (const list of [plugins, null]) {
      const nav = navigation('agent', null, list);
      expect(titles(crm(nav).children)).toEqual(['Service Requests']);
      expect(titles(nav)).not.toContain('Service Requests');
    }
  });

  it('admins and managers see every enabled CRM page and no top-level item', () => {
    const nav = navigation('org_admin', null, plugins);
    expect(titles(crm(nav).children)).toEqual(['Overview', 'Contacts', 'Service Requests', 'Companies', 'Deals', 'Plugins']);
    expect(titles(nav)).not.toContain('Service Requests');
    expect(titles(crm(navigation('org_manager', null, plugins)).children)).toContain('Service Requests');
  });

  it('routes: the board is its own tab, the rest of the CRM is not for agents', () => {
    expect(tabForPath('/crm/service-requests')).toBe('service-requests');
    expect(tabForPath('/crm/service-requests/abc')).toBe('service-requests');
    expect(tabForPath('/crm/service-requests-x')).toBe('crm');
    expect(canAccessPath('agent', '/crm/service-requests/abc')).toBe(true);
    expect(canAccessPath('agent', '/crm/contacts')).toBe(false);
    expect(canAccessPath('agent', '/crm')).toBe(false);
    expect(canAccessPath('agent', '/crm/plugins')).toBe(false);
    expect(canAccessPath('org_manager', '/crm/service-requests')).toBe(true);
  });
});
