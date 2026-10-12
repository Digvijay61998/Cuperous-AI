import { Injectable, Optional } from "@nestjs/common";
import { DealStage } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { CrmPluginService } from "../plugins/crm-plugin.service";

/** Deal stages that count as an open opportunity (in the pipeline, not closed). */
const OPEN_STAGES: DealStage[] = [
  DealStage.DEMO_BOOKED,
  DealStage.QUALIFIED_TO_BUY,
  DealStage.DECISION_MAKER_BOUGHT_IN,
  DealStage.CONTRACT_SENT,
];

/**
 * Counts for the CRM overview. A plugin that is off reports null for its
 * figures (crm-plugins-service-desk R8.1), so the dashboard hides its card.
 */
export interface CrmStats {
  contacts: number;
  companies: number | null;
  deals: number | null;
  openDeals: number | null;
  wonDeals: number | null;
  pipelineValue: number | null;
  currency: string;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly crm: CrmPrismaService,
    @Optional() private readonly plugins?: CrmPluginService,
  ) {}

  async overview(orgId: string): Promise<CrmStats> {
    const db = this.crm.forOrg(orgId);
    const live = { organizationId: orgId, archivedAt: null };
    const [companiesOn, dealsOn] = this.plugins
      ? await Promise.all([this.plugins.isEnabled(orgId, "companies"), this.plugins.isEnabled(orgId, "deals")])
      : [true, true];

    const [contacts, companies, deals, openDeals, wonDeals, pipeline] = await Promise.all([
      db.contact.count({ where: live }),
      companiesOn ? db.company.count({ where: live }) : null,
      dealsOn ? db.deal.count({ where: live }) : null,
      dealsOn ? db.deal.count({ where: { ...live, stage: { in: OPEN_STAGES } } }) : null,
      dealsOn ? db.deal.count({ where: { ...live, stage: DealStage.CLOSED_WON } }) : null,
      dealsOn ? db.deal.aggregate({ where: { ...live, stage: { in: OPEN_STAGES } }, _sum: { amount: true } }) : null,
    ]);

    return {
      contacts,
      companies,
      deals,
      openDeals,
      wonDeals,
      pipelineValue: pipeline ? (pipeline._sum.amount ? Number(pipeline._sum.amount) : 0) : null,
      // Reporting currency becomes a per-org setting in a later phase; USD for now.
      currency: "USD",
    };
  }
}
