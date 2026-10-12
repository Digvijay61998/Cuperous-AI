import { Role } from '../enums/role.enum';
import { ROLE_TABS, Tab, tabsForRole } from './role-tabs';

// Design §5.1 tab matrix. Keep in sync with QuantumMind-ui/src/utils/role-tabs.ts.
const ALL = [
  'dashboards',
  'conversations',
  'bots',
  'agents',
  'visitors',
  'management',
  'service-requests',
  'question-bank',
  'templates',
  'crm',
  'marketing',
  'social-messengers',
  'channel-providers',
  'reports',
  'support',
];

describe('tabsForRole', () => {
  it('defines exactly the 15 dashboard tab keys', () => {
    expect(Object.values(Tab)).toEqual(ALL);
  });

  it('ORG_ADMIN sees all 15 tabs', () => {
    expect(tabsForRole(Role.ORG_ADMIN)).toEqual(ALL);
  });

  it('ORG_MANAGER sees all tabs except Channel Providers', () => {
    const tabs = tabsForRole(Role.ORG_MANAGER);
    expect(tabs).toEqual(ALL.filter((t) => t !== 'channel-providers'));
    expect(tabs).toHaveLength(14);
  });

  it('AGENT sees conversations, visitors, service-requests, support', () => {
    expect(tabsForRole(Role.AGENT)).toEqual([
      'conversations',
      'visitors',
      'service-requests',
      'support',
    ]);
  });

  it('SUPER_ADMIN has every org-dashboard tab', () => {
    expect(tabsForRole(Role.SUPER_ADMIN)).toEqual(tabsForRole(Role.ORG_ADMIN));
  });

  it.each([undefined, null, '', 'ORG_ADMIN', 'owner', 'constructor', '__proto__'])(
    'fails closed for unknown role %p',
    (role) => {
      expect(tabsForRole(role as any)).toEqual([]);
    },
  );

  it('returns a copy so callers cannot mutate the matrix', () => {
    tabsForRole(Role.AGENT).push(Tab.BOTS);
    expect(ROLE_TABS[Role.AGENT]).not.toContain(Tab.BOTS);
  });
});
