import { RoleEnum, AccessTypesEnum } from 'src/utils';
import {
  isRoleNeutralPath,
  tabForPath,
  tabsForRole,
} from 'src/utils/role-tabs';

/**
 * Central client-side RBAC decision. Mirrors the backend tab matrix + role
 * rules. The backend remains the source of truth (every API is guarded); this
 * only shapes what the UI shows/enables.
 *
 * - READ/VIEW with a path: allowed only if the path's tab is in the role's tabs.
 *   Role-neutral pages (account settings, errors) are open to any platform role;
 *   any other unmapped route is denied (fail closed).
 * - Write actions (CREATE/UPDATE/DELETE/ACTION): ORG_ADMIN and ORG_MANAGER only;
 *   AGENT is read-only in the dashboard (their inbox actions are not gated here).
 * - `/super-admin` is SUPER_ADMIN-only, and SUPER_ADMIN may only use the console
 *   (it has no org data; it acts inside an org via impersonation).
 */
export const access = (role: string, type: string, path?: string) => {
  if (type === AccessTypesEnum.READ || type === AccessTypesEnum.VIEW) {
    return path ? canAccessPath(role, path) : tabsForRole(role).length > 0;
  }

  // Write / action permissions.
  return role === RoleEnum.ORG_ADMIN || role === RoleEnum.ORG_MANAGER;
};

/** True when a role may open a given route path. */
export const canAccessPath = (role: string, path: string): boolean => {
  if (path.startsWith('/super-admin')) return role === RoleEnum.SUPER_ADMIN;
  if (isRoleNeutralPath(path)) return !!role;
  if (role === RoleEnum.SUPER_ADMIN) return false;
  const tab = tabForPath(path);
  if (tab === null) return false;
  return tabsForRole(role).includes(tab);
};
