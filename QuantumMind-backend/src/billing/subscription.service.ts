import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SUBSCRIPTION_PROVIDER } from 'src/constants';
import { assertValidFeatureKeys } from 'src/common/constants/feature-catalog';
import { SubscriptionDocument } from './entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { PlanLimits } from './entities/plan.entity';
import { EntitlementService } from './entitlement.service';

export interface SubscriptionOverrides {
  limits?: Partial<PlanLimits>;
  features?: Record<string, boolean>;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(SUBSCRIPTION_PROVIDER)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly entitlementService: EntitlementService,
  ) {}

  findByOrg(organizationId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ organizationId }).exec();
  }

  countActive(): Promise<number> {
    return this.subscriptionModel
      .countDocuments({ status: SubscriptionStatus.ACTIVE })
      .exec();
  }

  async create(input: {
    organizationId: string;
    planId: string;
    overrides?: SubscriptionOverrides;
    status?: SubscriptionStatus;
  }): Promise<SubscriptionDocument> {
    if (input.overrides?.features) {
      assertValidFeatureKeys(Object.keys(input.overrides.features));
    }
    const subscription = await this.subscriptionModel.create({
      organizationId: input.organizationId,
      planId: input.planId,
      overrides: input.overrides ?? {},
      status: input.status ?? SubscriptionStatus.ACTIVE,
    });
    this.entitlementService.invalidate(input.organizationId);
    return subscription;
  }

  /** Merge-updates the per-org overrides and/or plan/status, then busts cache. */
  async update(
    organizationId: string,
    changes: {
      planId?: string;
      status?: SubscriptionStatus;
      overrides?: SubscriptionOverrides;
    },
  ): Promise<SubscriptionDocument | null> {
    const subscription = await this.subscriptionModel.findOne({
      organizationId,
    });
    if (!subscription) return null;

    if (changes.planId) subscription.planId = changes.planId as any;
    if (changes.status) subscription.status = changes.status;
    if (changes.overrides) {
      if (changes.overrides.features) {
        assertValidFeatureKeys(Object.keys(changes.overrides.features));
      }
      subscription.overrides = {
        limits: {
          ...(subscription.overrides?.limits ?? {}),
          ...(changes.overrides.limits ?? {}),
        },
        features: {
          ...(subscription.overrides?.features ?? {}),
          ...(changes.overrides.features ?? {}),
        },
      };
      subscription.markModified('overrides');
    }
    await subscription.save();
    this.entitlementService.invalidate(organizationId);
    return subscription;
  }
}
