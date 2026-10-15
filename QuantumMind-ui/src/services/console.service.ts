import Axios from 'src/helper/Axios';

export interface OrgLimits {
  maxBots: number;
  maxAgents: number;
  maxPlatforms: number;
  maxTemplates: number;
}

export const LIMIT_FIELDS: { key: keyof OrgLimits; label: string }[] = [
  { key: 'maxBots', label: 'Max bots' },
  { key: 'maxAgents', label: 'Max agents / managers' },
  { key: 'maxPlatforms', label: 'Max platforms (channels)' },
  { key: 'maxTemplates', label: 'Max templates' },
];

export interface OrgMeta {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  ownerId: string | null;
  owner: { _id: string; name: string; email: string } | null;
  planId: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
  limits: OrgLimits | null;
  features: Record<string, boolean> | null;
  overrides: { limits?: Partial<OrgLimits>; features?: Record<string, boolean> } | null;
  usage: { bots: number; agents: number; templates: number; platforms: number };
  counts: { orgManagers: number; agents: number };
  createdAt?: string;
}

export interface OverviewData {
  organizations: number;
  orgAdmins: number;
  orgManagers: number;
  agents: number;
  bots: number;
  platforms?: number;
  activeSubscriptions: number;
}

export interface PlanData {
  _id: string;
  name: string;
  limits: OrgLimits;
  features: Record<string, boolean>;
}

export interface AuditLogRow {
  _id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  organizationId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface CreateOrgPayload {
  name: string;
  owner: { name: string; email: string; password: string };
  planId: string;
  limits?: Partial<OrgLimits>;
  features?: Record<string, boolean>;
}

export interface UpdateOrgPayload {
  name?: string;
  status?: 'active' | 'suspended';
  subscriptionStatus?: string;
  planId?: string;
  limits?: Partial<OrgLimits>;
  features?: Record<string, boolean>;
}

/** Nest error messages may be a string or a string[] (validation errors). */
export const apiError = (err: any, fallback: string) => {
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  return m || err?.message || fallback;
};

export const ConsoleService = {
  overview: () =>
    Axios.get<OverviewData>('/admin/overview').then((r) => r.data),

  plans: () => Axios.get<PlanData[]>('/admin/plans').then((r) => r.data),

  features: () =>
    Axios.get<{ features: string[] }>('/admin/features').then(
      (r) => r.data.features,
    ),

  auditLogs: (params: { organizationId?: string; skip?: number; limit?: number }) =>
    Axios.get<{ data: AuditLogRow[]; count: number }>('/admin/audit-logs', {
      params,
    }).then((r) => r.data),

  listOrganizations: () =>
    Axios.get<OrgMeta[]>('/organizations').then((r) => r.data),

  getOrganization: (id: string) =>
    Axios.get<OrgMeta>(`/organizations/${id}`).then((r) => r.data),

  createOrganization: (payload: CreateOrgPayload) =>
    Axios.post('/organizations', payload).then((r) => r.data),

  updateOrganization: (id: string, changes: UpdateOrgPayload) =>
    Axios.patch<OrgMeta>(`/organizations/${id}`, changes).then((r) => r.data),

  reconcile: (id: string) =>
    Axios.post<OrgMeta>(`/organizations/${id}/reconcile`, {}).then((r) => r.data),

  impersonate: (id: string) =>
    Axios.post<{ accessToken: string; organizationId: string; expiresIn: string }>(
      `/organizations/${id}/impersonate`,
      {},
    ).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Impersonation session handling
//
// The super admin's own tokens are stashed while acting as an org, so "Exit"
// restores the console session without a re-login. The impersonation token has
// no refresh token; when it expires the Axios interceptor falls back to the
// stashed refresh token only after the session is explicitly ended.
// ---------------------------------------------------------------------------
const STASH_ACCESS = 'superAdminAccessToken';
const STASH_REFRESH = 'superAdminRefreshToken';
const IMPERSONATING = 'impersonatingOrg';

export const startImpersonation = (
  accessToken: string,
  org: { id: string; name: string },
) => {
  const ls = window.localStorage;
  // Never overwrite the stash if already impersonating (nested sessions).
  if (!ls.getItem(STASH_ACCESS)) {
    ls.setItem(STASH_ACCESS, ls.getItem('accessToken') || '');
    ls.setItem(STASH_REFRESH, ls.getItem('refreshToken') || '');
  }
  ls.setItem('accessToken', accessToken);
  // The impersonation session must NOT be refreshable as the org owner.
  ls.removeItem('refreshToken');
  ls.setItem(IMPERSONATING, JSON.stringify(org));
  // Keep `userData` until the reload: AuthContext re-fetches `/me` with the new
  // token and overwrites it. Clearing it here makes AuthGuard/GuestGuard see "no
  // session" during the `/me` round-trip and bounce to /login (stuck spinner).
  window.location.href = '/';
};

export const impersonatedOrg = (): { id: string; name: string } | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(IMPERSONATING) || 'null');
  } catch {
    return null;
  }
};

export const endImpersonation = () => {
  const ls = window.localStorage;
  const access = ls.getItem(STASH_ACCESS);
  const refresh = ls.getItem(STASH_REFRESH);
  ls.removeItem(IMPERSONATING);
  ls.removeItem(STASH_ACCESS);
  ls.removeItem(STASH_REFRESH);
  if (access) {
    ls.setItem('accessToken', access);
    // Keep `userData` until the reload so the guards still see a session while
    // AuthContext re-fetches `/me` for the restored super-admin token; it is
    // overwritten on load. Clearing it early bounced the page to /login.
  } else {
    // No stashed session to return to: a genuine logout, clear everything.
    ls.removeItem('accessToken');
    ls.removeItem('userData');
  }
  if (refresh) ls.setItem('refreshToken', refresh);
  window.location.href = access ? '/super-admin' : '/login';
};

export default ConsoleService;
