import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/util/current-user.decorator";
import { OrgId } from "../common/org-id.decorator";
import { DecideFactDto } from "./dto/decide-fact.dto";
import { FactsService } from "./facts.service";

@Controller("crm")
@ApiTags("CRM Facts")
@ApiSecurity("bearer")
export class FactsController {
  constructor(private readonly factsService: FactsService) {}

  @Get("contacts/:contactId/facts")
  async list(@OrgId() orgId: string, @Param("contactId") contactId: string) {
    return this.factsService.listForContact(orgId, contactId);
  }

  @Post("facts/:id/decide")
  async decide(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Param("id") id: string,
    @Body() dto: DecideFactDto,
  ) {
    return this.factsService.decideFact(orgId, id, dto.decision, user?._id);
  }
}
