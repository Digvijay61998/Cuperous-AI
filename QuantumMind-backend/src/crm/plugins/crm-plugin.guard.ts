import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CrmPluginService } from "./crm-plugin.service";
import { pluginDef } from "./plugin-registry";
import { CrmPluginRequirement, REQUIRES_CRM_PLUGIN_KEY } from "./requires-crm-plugin.decorator";

/**
 * Enforces `@RequiresCrmPlugin(...)` (crm-plugins-service-desk R8.3).
 *
 * A request without an organization is let through: `@OrgId()` rejects it
 * with its own message. A CRM outage while reading the plugin state fails
 * open, because the route itself needs the same database and will report the
 * real error.
 */
@Injectable()
export class CrmPluginGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly plugins: CrmPluginService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<CrmPluginRequirement>(REQUIRES_CRM_PLUGIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requirement) return true;
    const req = context.switchToHttp().getRequest();
    const key = typeof requirement === "function" ? requirement(req) : requirement;
    if (!key) return true;
    const orgId = req?.user?.organizationId;
    if (!orgId) return true;
    let enabled = true;
    try {
      enabled = await this.plugins.isEnabled(String(orgId), key);
    } catch {
      enabled = true;
    }
    if (!enabled) {
      throw new ForbiddenException(
        `The ${pluginDef(key).label} module is turned off for your organization. An admin can turn it on in CRM → Plugins.`,
      );
    }
    return true;
  }
}
