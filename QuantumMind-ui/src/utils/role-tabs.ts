import { RoleEnum } from './role.enum';

/**
 * Tab-based access config — the single source of truth for which dashboard
 * sections each role may see. Mirrors the backend ROLE_TABS. Used by the
 * navigation filter, the route guard, and the access() helper.
 *
 * MIRROR: `QuantumMind-backend/src/common/constants/role-tabs.ts` is the
 * authoritative copy (design §5.1). Keep tab keys and ROLE_TABS identical.
 * The backend enforces the same rules on every API; this only shapes the UI.
 */
export const ALL_TABS = [
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

export const ROLE_TABS: Record<string, string[]> = {
  // Super admin uses the /super-admin console, not the org dashboard.
  [RoleEnum.SUPER_ADMIN]: [],
  [RoleEnum.ORG_ADMIN]: ALL_TABS,
  [RoleEnum.ORG_MANAGER]: ALL_TABS.filter((t) => t !== 'channel-providers'),
  [RoleEnum.AGENT]: ['conversations', 'visitors', 'service-requests', 'support'],
};

/** Sidebar item title (from navigation/vertical) -> tab id. */
export const NAV_TITLE_TAB: Record<string, string> = {
  Dashboards: 'dashboards',
  Conversations: 'conversations',
  Bots: 'bots',
  Agents: 'agents',
  Visitors: 'visitors',
  Management: 'management',
  'Service Requests': 'service-requests',
  'Question Bank': 'question-bank',
  Templates: 'templates',
  CRM: 'crm',
  Marketing: 'marketing',
  'Social Messengers': 'social-messengers',
  'Channel Providers': 'channel-providers',
  Reports: 'reports',
  Support: 'support',
};

/**
 * Route path prefix -> tab id, for route guarding. Longest/most specific
 * prefixes first. Every dashboard page must map to a tab; see
 * {@link ROLE_NEUTRAL_PATHS} for the few pages any signed-in user may open.
 */
const PATH_TAB: Array<[string, string]> = [
  ['/dashboards', 'dashboards'],
  ['/charts', 'dashboards'],
  ['/apps/chat', 'conversations'],
  ['/bots', 'bots'],
  ['/scraping', 'bots'],
  ['/agent', 'agents'],
  ['/visitors', 'visitors'],
  ['/segments', 'management'],
  ['/tag', 'management'],
  ['/webhooks', 'management'],
  ['/documentation', 'management'],
  ['/organization', 'management'],
  ['/service-request', 'service-requests'],
  ['/question-bank', 'question-bank'],
  ['/templates', 'templates'],
  // The board is its own tab so agents can open it but not the rest of the CRM (R17.1).
  ['/crm/service-requests', 'service-requests'],
  ['/crm', 'crm'],
  ['/advertisements', 'marketing'],
  ['/offers', 'marketing'],
  ['/social', 'social-messengers'],
  ['/messaging', 'channel-providers'],
  ['/reports', 'reports'],
  ['/pricing', 'channel-providers'],
  ['/support', 'support'],
  ['/videos', 'support'],
];

/** Pages every authenticated role may open (identity, errors, landing). */
const ROLE_NEUTRAL_PATHS = [
  '/',
  '/account-settings',
  '/401',
  '/404',
  '/500',
  '/login',
  '/forgot-password',
];

const matchesPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(prefix + '/');

export const tabForPath = (path?: string): string | null => {
  if (!path) return null;
  for (const [prefix, tab] of PATH_TAB) {
    if (matchesPrefix(path, prefix)) return tab;
  }
  return null;
};

export const isRoleNeutralPath = (path?: string): boolean =>
  !!path &&
  ROLE_NEUTRAL_PATHS.some((p) => (p === '/' ? path === '/' : matchesPrefix(path, p)));

/**
 * Tabs visible to `role`. Fails closed: unknown / missing roles (including
 * inherited object keys like "constructor") get no tabs.
 */
export const tabsForRole = (role?: string | null): string[] =>
  typeof role === 'string' && Object.prototype.hasOwnProperty.call(ROLE_TABS, role)
    ? ROLE_TABS[role]
    : [];

export const roleCanSeeTab = (role: string, tab: string): boolean =>
  tabsForRole(role).includes(tab);

/** Post-login / landing home route for a role. */
export const homeRouteForRole = (role?: string): string => {
  if (role === RoleEnum.SUPER_ADMIN) return '/super-admin';
  if (role === RoleEnum.AGENT) return '/apps/chat/active';
  if (role === RoleEnum.ORG_ADMIN || role === RoleEnum.ORG_MANAGER)
    return '/dashboards/analytics';
  return '/login';
};
