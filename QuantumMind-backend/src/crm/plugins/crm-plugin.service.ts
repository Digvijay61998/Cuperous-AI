import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CrmPrismaService } from "../database/crm-prisma.service";
import {
  CorePluginError,
  CRM_PLUGINS,
  CrmPluginKey,
  effectiveStates,
  isPluginKey,
  planOrder,
  planToggle,
  pluginDef,
  PluginState,
  dependentsOf,
} from "./plugin-registry";

/** How long one instance trusts its cached plugin states (R8.5). */
export const PLUGIN_CACHE_TTL_MS = 30_000;

export interface PluginView {
  key: CrmPluginKey;
  label: string;
  description: string;
  icon: string;
  menuPath: string;
  showInMenu: boolean;
  core: boolean;
  enabled: boolean;
  position: number;
  dependsOn: CrmPluginKey[];
  /** Plugins that need this one (turned off with it). */
  requiredBy: CrmPluginKey[];
}

/**
 * Per-org CRM plugin state (crm-plugins-service-desk R6–R8).
 *
 * Reads are cached per org for 30 s, so the guard on every Companies / Deals
 * request costs nothing; a write clears this instance's cache at once and
 * other instances within the TTL. Turning a plugin off never touches its data
 * (R7.5).
 */
@Injectable()
export class CrmPluginService {
  private readonly logger = new Logger(CrmPluginService.name);
  private readonly cache = new Map<string, { states: PluginState[]; at: number }>();

  constructor(private readonly crm: CrmPrismaService) {}

  async states(orgId: string): Promise<PluginState[]> {
    const hit = this.cache.get(orgId);
    if (hit && Date.now() - hit.at < PLUGIN_CACHE_TTL_MS) return hit.states;
    const rows = await this.crm.forOrg(orgId).crmPluginSetting.findMany({
      where: { organizationId: orgId },
      select: { key: true, enabled: true, position: true },
    });
    const states = effectiveStates(rows);
    this.cache.set(orgId, { states, at: Date.now() });
    return states;
  }

  async list(orgId: string): Promise<PluginView[]> {
    return (await this.states(orgId)).map((s) => toView(s));
  }

  async isEnabled(orgId: string, key: CrmPluginKey): Promise<boolean> {
    if (pluginDef(key).core) return true;
    return !!(await this.states(orgId)).find((s) => s.key === key)?.enabled;
  }

  /**
   * Turn a plugin on or off, with its dependencies / dependents (R7.3,
   * R7.4). `dryRun` returns the changes without saving, for the confirm
   * dialog. One transaction; who changed it is recorded (R7.7).
   */
  async setEnabled(
    orgId: string,
    key: string,
    enabled: boolean,
    userId: string | undefined,
    opts: { dryRun?: boolean } = {},
  ): Promise<{ changes: { key: CrmPluginKey; label: string; enabled: boolean }[]; plugins: PluginView[] }> {
    if (!isPluginKey(key)) throw new NotFoundException(`There is no CRM plugin "${key}".`);
    const states = await this.fresh(orgId);
    let changes: { key: CrmPluginKey; enabled: boolean }[];
    try {
      changes = planToggle(states, key, enabled);
    } catch (error) {
      if (error instanceof CorePluginError) throw new BadRequestException(error.message);
      throw error;
    }
    const labelled = changes.map((c) => ({ ...c, label: pluginDef(c.key).label }));
    if (opts.dryRun || !changes.length) return { changes: labelled, plugins: states.map(toView) };

    const position = new Map(states.map((s) => [s.key, s.position]));
    const db = this.crm.forOrg(orgId);
    await db.$transaction(
      changes.map((c) =>
        db.crmPluginSetting.upsert({
          where: { organizationId_key: { organizationId: orgId, key: c.key } },
          create: {
            organizationId: orgId,
            key: c.key,
            enabled: c.enabled,
            position: position.get(c.key) ?? 0,
            updatedById: userId ?? null,
          },
          update: { enabled: c.enabled, updatedById: userId ?? null },
        }),
      ),
    );
    this.cache.delete(orgId);
    this.logger.log({ message: "CRM plugins changed", orgId, userId, changes });
    return { changes: labelled, plugins: await this.list(orgId) };
  }

  /** Menu order (R7.6). */
  async reorder(orgId: string, keys: string[], userId: string | undefined): Promise<PluginView[]> {
    if (!Array.isArray(keys) || !keys.some(isPluginKey)) {
      throw new BadRequestException("Give the plugin keys in the order to show them.");
    }
    const states = await this.fresh(orgId);
    const positions = planOrder(states, keys);
    const db = this.crm.forOrg(orgId);
    await db.$transaction(
      states.map((s) =>
        db.crmPluginSetting.upsert({
          where: { organizationId_key: { organizationId: orgId, key: s.key } },
          // Storing the current state with the position keeps the row honest
          // even when it did not exist before (default state).
          create: {
            organizationId: orgId,
            key: s.key,
            enabled: s.enabled,
            position: positions.get(s.key) ?? 0,
            updatedById: userId ?? null,
          },
          update: { position: positions.get(s.key) ?? 0, updatedById: userId ?? null },
        }),
      ),
    );
    this.cache.delete(orgId);
    return this.list(orgId);
  }

  /** Bypass the cache before a write so a toggle never plans on stale state. */
  private async fresh(orgId: string): Promise<PluginState[]> {
    this.cache.delete(orgId);
    return this.states(orgId);
  }
}

function toView(s: PluginState): PluginView {
  const def = pluginDef(s.key);
  return {
    key: s.key,
    label: def.label,
    description: def.description,
    icon: def.icon,
    menuPath: def.menuPath,
    showInMenu: def.showInMenu,
    core: def.core,
    enabled: s.enabled,
    position: s.position,
    dependsOn: [...def.dependsOn],
    requiredBy: dependentsOf(s.key),
  };
}

export { CRM_PLUGINS };
