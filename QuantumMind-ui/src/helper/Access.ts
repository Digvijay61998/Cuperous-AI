import { RoleEnum, AccessTypesEnum } from 'src/utils';
import { ROLE_TABS, tabForPath } from 'src/utils/role-tabs';

/**
 * Central client-side RBAC decision. Mirrors the backend tab matrix + role
 * rules. The backend remains the source of truth (every API is guarded); this
 * only shapes what the UI shows/enables.
 *
 * - READ/VIEW with a path: allowed only if the path's tab is in the role's tabs
 *   (unmapped utility routes are allowed for any authenticated user).
 * - Write actions (CREATE/UPDATE/DELETE/ACTION): allowed for ORG_ADMIN and
 *   ORG_MANAGER; AGENT is read-only in the dashboard (their inbox actions are
 *   not gated here).
 * - Anything under /super-admin is SUPER_ADMIN-only.
 */
export const access = (role: string, type: string, path?: string) => {
  // The super-admin console is off-limits to everyone else.
  if (path && path.startsWith('/super-admin')) {
    return role === RoleEnum.SUPER_ADMIN;
  }

  // Super admin operates the console; treat as full-access elsewhere in-app.
  if (role === RoleEnum.SUPER_ADMIN) return true;

  const tabs = ROLE_TABS[role] ?? [];

  if (type === AccessTypesEnum.READ || type === AccessTypesEnum.VIEW) {
    const tab = tabForPath(path);
    if (tab === null) return true; // unmapped route: allow authenticated user
    return tabs.includes(tab);
  }

  // Write / action permissions.
  if (role === RoleEnum.ORG_ADMIN || role === RoleEnum.ORG_MANAGER) {
    return true;
  }

  // AGENT and anything else: read-only in the dashboard.
  return false;
};

/** True when a role may open a given route path. */
export const canAccessPath = (role: string, path: string): boolean => {
  if (path.startsWith('/super-admin')) return role === RoleEnum.SUPER_ADMIN;
  if (role === RoleEnum.SUPER_ADMIN) return true;
  const tab = tabForPath(path);
  if (tab === null) return true;
  return (ROLE_TABS[role] ?? []).includes(tab);
};
