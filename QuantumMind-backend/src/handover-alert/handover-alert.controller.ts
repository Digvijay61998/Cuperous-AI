import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { CurrentUser } from "src/util/current-user.decorator";
import { AckHandoverAlertDto } from "./dto/ack-handover-alert.dto";
import { HandoverAlertService } from "./handover-alert.service";

@Controller("handover-alerts")
@ApiTags("Handover Alerts")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
export class HandoverAlertController {
  constructor(private readonly handoverAlertService: HandoverAlertService) {}

  /** Unacknowledged alerts where the caller is a recipient, scoped to their org. */
  @Get()
  async listOpen(@CurrentUser() user: any) {
    return this.handoverAlertService.listOpenForUser(user);
  }

  @Post(":id/ack")
  async acknowledge(
    @Param("id") id: string,
    @Body() body: AckHandoverAlertDto,
    @CurrentUser() user: any,
  ) {
    return this.handoverAlertService.acknowledge(id, user, body.resolution);
  }
}
