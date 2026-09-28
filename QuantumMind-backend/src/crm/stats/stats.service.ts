import { Injectable } from "@nestjs/common";
import { DealStage } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";

/** Deal stages that count as an open opportunity (in the pipeline, not closed). */
const OPEN_STAGES: DealStage[] = [
  DealStage.DEMO_BOOKED,
  DealStage.QUALIFIED_TO_BUY,
  DealStage.DECISION_MAKER_BOUGHT_IN,
  DealStage.CONTRACT_SENT,
];

export interface CrmStats {
  contacts: number;
  companies: number;
  deals: number;
  openDeals: number;
  wonDeals: number;
  pipelineValue: number;
  currency: string;
}

@Injectable()
export class StatsService {
  constructor(private readonly crm: CrmPrismaService) {}

  async overview(orgId: string): Promise<CrmStats> {
    const db = this.crm.forOrg(orgId);

    const [contacts, companies, deals, openDeals, wonDeals, pipeline] =
      await Promise.all([
        db.contact.count({ where: { organizationId: orgId, archivedAt: null } }),
        db.company.count({ where: { organizationId: orgId, archivedAt: null } }),
        db.deal.count({ where: { organizationId: orgId, archivedAt: null } }),
        db.deal.count({
          where: {
            organizationId: orgId,
            archivedAt: null,
            stage: { in: OPEN_STAGES },
          },
        }),
        db.deal.count({
          where: {
            organizationId: orgId,
            archivedAt: null,
            stage: DealStage.CLOSED_WON,
          },
        }),
        db.deal.aggregate({
          where: {
            organizationId: orgId,
            archivedAt: null,
            stage: { in: OPEN_STAGES },
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      contacts,
      companies,
      deals,
      openDeals,
      wonDeals,
      pipelineValue: pipeline._sum.amount ? Number(pipeline._sum.amount) : 0,
      // Reporting currency becomes a per-org setting in a later phase; USD for now.
      currency: "USD",
    };
  }
}
