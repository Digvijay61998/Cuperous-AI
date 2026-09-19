import { Global, Module } from '@nestjs/common';
import { BillingProviders } from './billing.provider';
import { EntitlementService } from './entitlement.service';
import { PlanService } from './plan.service';
import { SubscriptionService } from './subscription.service';

/**
 * Global so the entitlement service and feature guard can be used across
 * modules. PlanService seeds the starter plans on startup; SubscriptionService
 * manages per-org subscriptions/overrides (used by the super-admin console).
 */
@Global()
@Module({
  providers: [
    EntitlementService,
    PlanService,
    SubscriptionService,
    ...BillingProviders,
  ],
  exports: [
    EntitlementService,
    PlanService,
    SubscriptionService,
    ...BillingProviders,
  ],
})
export class BillingModule {}
