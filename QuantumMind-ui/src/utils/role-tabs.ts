import { RoleEnum } from './role.enum';

/**
 * Tab-based access config — the single source of truth for which dashboard
 * sections each role may see. Mirrors the backend ROLE_TABS. Used by the
 * navigation filter, the route guard, and the access() helper.
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

/** Route path prefix -> tab id, for route guarding. */
const PATH_TAB: Array<[string, string]> = [
  ['/dashboards', 'dashboards'],
  ['/apps/chat', 'conversations'],
  ['/bots', 'bots'],
  ['/agent', 'agents'],
  ['/visitors', 'visitors'],
  ['/segments', 'management'],
  ['/tag', 'management'],
  ['/service-request', 'service-requests'],
  ['/question-bank', 'question-bank'],
  ['/templates', 'templates'],
  ['/crm', 'crm'],
  ['/advertisements', 'marketing'],
  ['/offers', 'marketing'],
  ['/social', 'social-messengers'],
  ['/messaging', 'channel-providers'],
  ['/reports', 'reports'],
  ['/support', 'support'],
  ['/videos', 'support'],
];

export const tabForPath = (path?: string): string | null => {
  if (!path) return null;
  for (const [prefix, tab] of PATH_TAB) {
    if (path.startsWith(prefix)) return tab;
  }
  return null;
};

export const roleCanSeeTab = (role: string, tab: string): boolean =>
  (ROLE_TABS[role] ?? []).includes(tab);

/** Post-login / landing home route for a role. */
export const homeRouteForRole = (role?: string): string => {
  if (role === RoleEnum.SUPER_ADMIN) return '/super-admin';
  if (role === RoleEnum.AGENT) return '/apps/chat/active';
  return '/dashboards/analytics';
};
