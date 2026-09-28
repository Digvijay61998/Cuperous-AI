import { Controller, Get } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { OrgId } from "../common/org-id.decorator";
import { StatsService } from "./stats.service";

@Controller("crm/stats")
@ApiTags("CRM Stats")
@ApiSecurity("bearer")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async overview(@OrgId() orgId: string) {
    return this.statsService.overview(orgId);
  }
}
