import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { PLAN_PROVIDER, SUBSCRIPTION_PROVIDER } from 'src/constants';
import {
  CounterField,
  OrganizationService,
} from 'src/organization/organization.service';
import { PlanDocument, PlanLimits } from './entities/plan.entity';
import { SubscriptionDocument } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { FEATURE_CATALOG } from 'src/common/constants/feature-catalog';

export interface EffectiveEntitlements {
  limits: PlanLimits;
  features: Record<string, boolean>;
}

const NO_LIMITS: PlanLimits = {
  maxBots: 0,
  maxAgents: 0,
  maxPlatforms: 0,
  maxTemplates: 0,
};

/** Coerces a stored limit to a safe non-negative integer (or undefined). */
function limitValue(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/** Resources that are quota-limited via an Organization counter. */
export type CountedResource = 'bot' | 'agent' | 'template' | 'platform';

const RESOURCE_META: Record<
  CountedResource,
  {
    counter: CounterField;
    limit: keyof PlanLimits;
  }
> = {
  bot: { counter: 'botCount', limit: 'maxBots' },
  agent: { counter: 'agentCount', limit: 'maxAgents' },
  template: { counter: 'templateCount', limit: 'maxTemplates' },
  platform: { counter: 'platformCount', limit: 'maxPlatforms' },
};

const CACHE_TTL_MS = 30_000;

/**
 * Computes and enforces an organization's entitlements (limits + features).
 *
 * Effective value = plan default, overridden by the subscription's override for
 * that key. Reads are cached per org for a short TTL because they run on nearly
 * every create/feature-gated request; the cache is invalidated whenever a
 * subscription changes (see {@link invalidate}).
 *
 * FAIL-CLOSED: an organization with no subscription (or a subscription whose
 * plan is missing) gets zero limits and no features. Orgs are only created via
 * the super-admin flow, which always attaches a subscription, so a missing one
 * is a broken state that must not silently grant unlimited usage. A CANCELED
 * subscription is treated the same way (existing data is kept; nothing new can
 * be created and gated features are off).
 *
 * The cache is per process (30s TTL). In a multi-instance deployment a limit
 * change can take up to the TTL to be seen everywhere; the counter increment
 * itself is always atomic in the database.
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly cache = new Map<
    string,
    { value: EffectiveEntitlements | null; expiresAt: number }
  >();

  constructor(
    @Inject(PLAN_PROVIDER) private readonly planModel: Model<PlanDocument>,
    @Inject(SUBSCRIPTION_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly organizationService: OrganizationService,
  ) {}

  invalidate(organizationId: string): void {
    this.cache.delete(String(organizationId));
  }

  async getEffective(
    organizationId: string,
  ): Promise<EffectiveEntitlements | null> {
    const key = String(organizationId);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await this.computeEffective(organizationId);
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  private async computeEffective(
    organizationId: string,
  ): Promise<EffectiveEntitlements | null> {
    const subscription = await this.subscriptionModel
      .findOne({ organizationId })
      .lean();
    if (!subscription) {
      this.logger.warn(
        `No subscription for org ${organizationId}; denying all entitlements`,
      );
      return { limits: { ...NO_LIMITS }, features: {} };
    }
    if (subscription.status === SubscriptionStatus.CANCELED) {
      return { limits: { ...NO_LIMITS }, features: {} };
    }

    const plan = await this.planModel.findById(subscription.planId).lean();
    if (!plan) {
      this.logger.warn(
        `Subscription ${organizationId} references missing plan ${subscription.planId}; denying all entitlements`,
      );
      return { limits: { ...NO_LIMITS }, features: {} };
    }

    const overrides = subscription.overrides ?? {};
    const planLimits = (plan.limits ?? {}) as Partial<PlanLimits>;
    const overrideLimits = (overrides.limits ?? {}) as Partial<PlanLimits>;
    // Construct explicitly from the known keys so no stored subdoc `_id` leaks
    // into API responses.
    const pick = (k: keyof PlanLimits) =>
      limitValue(overrideLimits[k]) ?? limitValue(planLimits[k]) ?? 0;
    const limits: PlanLimits = {
      maxBots: pick('maxBots'),
      maxAgents: pick('maxAgents'),
      maxPlatforms: pick('maxPlatforms'),
      maxTemplates: pick('maxTemplates'),
    };
    // Only catalog keys, only real booleans: a stray stored key can never
    // surface as an enabled feature.
    const features: Record<string, boolean> = {};
    for (const key of FEATURE_CATALOG) {
      const o = (overrides.features ?? {})[key];
      const p = (plan.features ?? {})[key];
      features[key] =
        typeof o === 'boolean' ? o : typeof p === 'boolean' ? p : false;
    }
    return { limits, features };
  }

  async isFeatureEnabled(
    organizationId: string,
    featureKey: string,
  ): Promise<boolean> {
    if (!organizationId) return false;
    const effective = await this.getEffective(organizationId);
    return effective?.features?.[featureKey] === true;
  }

  /**
   * Atomically reserves one unit of quota for `resource` before a create.
   * Throws when the org has reached its effective limit (a missing/canceled
   * subscription has a limit of 0). No-op only when there is no organization
   * (org-independent SUPER_ADMIN paths).
   *
   * The caller MUST call {@link releaseQuota} if the subsequent create fails, so
   * the counter does not drift.
   */
  async reserveQuota(
    organizationId: string | null | undefined,
    resource: CountedResource,
  ): Promise<void> {
    if (!organizationId) return;
    const effective = await this.getEffective(organizationId);

    const { counter, limit } = RESOURCE_META[resource];
    const max = effective?.limits?.[limit] ?? 0;

    const ok = await this.organizationService.reserveCounter(
      String(organizationId),
      counter,
      max,
    );
    if (!ok) {
      throw new ForbiddenException(
        `Your plan's ${resource} limit (${max}) has been reached. Upgrade to add more.`,
      );
    }
  }

  async releaseQuota(
    organizationId: string | null | undefined,
    resource: CountedResource,
  ): Promise<void> {
    if (!organizationId) return;
    const { counter } = RESOURCE_META[resource];
    await this.organizationService.releaseCounter(
      String(organizationId),
      counter,
    );
  }
}
