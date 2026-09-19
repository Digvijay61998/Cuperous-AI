import { Role } from '../enums/role.enum';

/**
 * Dashboard sidebar tabs. Keys mirror the entries in the UI navigation
 * (`QuantumMind-ui/src/navigation/vertical/index.ts`). This is the single
 * source of truth for tab-based access; the UI filters its navigation from the
 * same mapping (surfaced via `GET /me/entitlements`) and each tab's APIs are
 * guarded with `@Roles(...)`.
 */
export enum Tab {
  DASHBOARDS = 'dashboards',
  CONVERSATIONS = 'conversations',
  BOTS = 'bots',
  AGENTS = 'agents',
  VISITORS = 'visitors',
  MANAGEMENT = 'management',
  SERVICE_REQUESTS = 'service-requests',
  QUESTION_BANK = 'question-bank',
  TEMPLATES = 'templates',
  CRM = 'crm',
  MARKETING = 'marketing',
  SOCIAL_MESSENGERS = 'social-messengers',
  CHANNEL_PROVIDERS = 'channel-providers',
  REPORTS = 'reports',
  SUPPORT = 'support',
}

const ALL_TABS: Tab[] = Object.values(Tab);

/**
 * Role -> visible tabs.
 *
 * - SUPER_ADMIN uses the separate `/super-admin` console, not this dashboard,
 *   so it has no operational tabs here.
 * - ORG_ADMIN sees everything.
 * - ORG_MANAGER sees everything except CHANNEL_PROVIDERS (org-level channel
 *   wiring); it is further restricted at the action level (can create AGENT
 *   only). NOTE: this row is the open review assumption from the design.
 * - AGENT sees the conversation-oriented tabs only.
 */
export const ROLE_TABS: Record<Role, Tab[]> = {
  [Role.SUPER_ADMIN]: [],
  [Role.ORG_ADMIN]: ALL_TABS,
  [Role.ORG_MANAGER]: ALL_TABS.filter((t) => t !== Tab.CHANNEL_PROVIDERS),
  [Role.AGENT]: [
    Tab.CONVERSATIONS,
    Tab.VISITORS,
    Tab.SERVICE_REQUESTS,
    Tab.SUPPORT,
  ],
};

export const tabsForRole = (role: Role): Tab[] => ROLE_TABS[role] ?? [];
