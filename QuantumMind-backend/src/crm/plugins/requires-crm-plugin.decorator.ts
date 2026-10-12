import { SetMetadata } from "@nestjs/common";
import type { CrmPluginKey } from "./plugin-registry";

export const REQUIRES_CRM_PLUGIN_KEY = "requiresCrmPlugin";

/**
 * Which plugin a request needs: a fixed key, or a function of the request
 * for shared routes (custom fields, saved views, activities) whose entity
 * decides it. Returning null means "no plugin needed".
 */
export type CrmPluginRequirement = CrmPluginKey | ((req: any) => CrmPluginKey | null);

/** Rejects the request with 403 while the plugin is off for the org (R8.3). */
export const RequiresCrmPlugin = (requirement: CrmPluginRequirement) =>
  SetMetadata(REQUIRES_CRM_PLUGIN_KEY, requirement);

/** COMPANY / DEAL entity in the query or body -> the plugin that owns it. */
export function pluginForEntity(req: any): CrmPluginKey | null {
  const entity = String(req?.query?.entity ?? req?.body?.entity ?? "").toUpperCase();
  if (entity === "COMPANY") return "companies";
  if (entity === "DEAL") return "deals";
  return null;
}

/** An activity on a deal or a company needs that plugin. */
export function pluginForActivity(req: any): CrmPluginKey | null {
  const src = { ...(req?.query || {}), ...(req?.body || {}) };
  if (src.dealId) return "deals";
  if (src.companyId) return "companies";
  return null;
}
