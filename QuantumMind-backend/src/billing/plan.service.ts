import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { PLAN_PROVIDER } from 'src/constants';
import {
  FEATURE_CATALOG,
  FeatureKey,
} from 'src/common/constants/feature-catalog';
import { PlanDocument } from './entities/plan.entity';

/** Builds a full feature map with only the listed keys enabled. */
function featureMap(enabled: FeatureKey[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const key of FEATURE_CATALOG) map[key] = enabled.includes(key);
  return map;
}

/**
 * Starter plans seeded on first startup. Numbers are the agreed defaults,
 * tuned per tier; a SUPER_ADMIN can edit them later and per-org overrides sit
 * on the subscription. Seeding never overwrites an existing plan (matched by
 * name), so operator edits survive restarts.
 */
const STARTER_PLANS = [
  {
    name: 'Basic',
    limits: { maxBots: 1, maxAgents: 3, maxPlatforms: 1, maxTemplates: 5 },
    features: featureMap(['channel.whatsapp_official']),
    billing: { price: 0, interval: 'month', currency: 'USD' },
  },
  {
    name: 'Pro',
    limits: { maxBots: 5, maxAgents: 10, maxPlatforms: 3, maxTemplates: 20 },
    features: featureMap([
      'channel.whatsapp_official',
      'channel.whatsapp_openwa',
      'channel.telegram',
      'question-bank',
    ]),
    billing: { price: 49, interval: 'month', currency: 'USD' },
  },
  {
    name: 'Enterprise',
    limits: { maxBots: 20, maxAgents: 50, maxPlatforms: 10, maxTemplates: 100 },
    features: featureMap([...FEATURE_CATALOG]),
    billing: { price: 199, interval: 'month', currency: 'USD' },
  },
];

@Injectable()
export class PlanService implements OnModuleInit {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    @Inject(PLAN_PROVIDER) private readonly planModel: Model<PlanDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const plan of STARTER_PLANS) {
      const existing = await this.planModel.findOne({ name: plan.name });
      if (!existing) {
        await this.planModel.create(plan);
        this.logger.debug(`Seeded starter plan: ${plan.name}`);
      }
    }
  }

  findAll(): Promise<PlanDocument[]> {
    return this.planModel.find().exec();
  }

  findById(id: string): Promise<PlanDocument | null> {
    return this.planModel.findById(id).exec();
  }
}
