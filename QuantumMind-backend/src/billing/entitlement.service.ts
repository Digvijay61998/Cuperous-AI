import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { PLAN_PROVIDER, SUBSCRIPTION_PROVIDER } from 'src/constants';
import { OrganizationService } from 'src/organization/organization.service';
import { PlanDocument, PlanLimits } from './entities/plan.entity';
import { SubscriptionDocument } from './entities/subscription.entity';

export interface EffectiveEntitlements {
  limits: PlanLimits;
  features: Record<string, boolean>;
}

/** Resources that are quota-limited via an Organization counter. */
export type CountedResource = 'bot' | 'agent' | 'template';

const RESOURCE_META: Record<
  CountedResource,
  {
    counter: 'botCount' | 'agentCount' | 'templateCount';
    limit: keyof PlanLimits;
  }
> = {
  bot: { counter: 'botCount', limit: 'maxBots' },
  agent: { counter: 'agentCount', limit: 'maxAgents' },
  template: { counter: 'templateCount', limit: 'maxTemplates' },
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
 * Fail-open on missing configuration: an org with no subscription is NOT
 * blocked (limits are resource caps, not a security boundary), but the event is
 * logged. Tenant isolation and role checks remain the hard boundaries.
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
        `No subscription for org ${organizationId}; entitlements unenforced`,
      );
      return null;
    }

    const plan = await this.planModel.findById(subscription.planId).lean();
    if (!plan) {
      this.logger.warn(
        `Subscription ${organizationId} references missing plan ${subscription.planId}`,
      );
      return null;
    }

    const overrides = subscription.overrides ?? {};
    const planLimits = (plan.limits ?? {}) as Partial<PlanLimits>;
    const overrideLimits = (overrides.limits ?? {}) as Partial<PlanLimits>;
    // Construct explicitly from the known keys so no stored subdoc `_id` leaks
    // into API responses.
    const limits: PlanLimits = {
      maxBots: overrideLimits.maxBots ?? planLimits.maxBots ?? 0,
      maxAgents: overrideLimits.maxAgents ?? planLimits.maxAgents ?? 0,
      maxPlatforms: overrideLimits.maxPlatforms ?? planLimits.maxPlatforms ?? 0,
      maxTemplates: overrideLimits.maxTemplates ?? planLimits.maxTemplates ?? 0,
    };
    const features: Record<string, boolean> = {
      ...(plan.features ?? {}),
      ...(overrides.features ?? {}),
    };
    return { limits, features };
  }

  async isFeatureEnabled(
    organizationId: string,
    featureKey: string,
  ): Promise<boolean> {
    const effective = await this.getEffective(organizationId);
    // No subscription -> unenforced (fail-open); see class docs.
    if (!effective) return true;
    return effective.features?.[featureKey] === true;
  }

  /**
   * Atomically reserves one unit of quota for `resource` before a create.
   * Throws when the org has reached its effective limit. No-op when there is no
   * organization (transitional/unassigned resources) or no subscription.
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
    if (!effective) return;

    const { counter, limit } = RESOURCE_META[resource];
    const max = effective.limits?.[limit] ?? 0;

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
