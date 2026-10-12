import { Body, Controller, Get, Param, Patch, Put, Query } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsString } from "class-validator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES, ORG_STAFF } from "src/common/enums/role.enum";
import { CurrentUser } from "src/util/current-user.decorator";
import { OrgId } from "../common/org-id.decorator";
import { CrmPluginService } from "./crm-plugin.service";

export class SetPluginEnabledDto {
  @Type(() => Boolean)
  @IsBoolean()
  enabled: boolean;
}

export class ReorderPluginsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  keys: string[];
}

/**
 * CRM → Plugins (crm-plugins-service-desk R7). Everyone in the org reads the
 * list (the dashboard builds the CRM menu from it); only org admins and
 * managers change it, agents get 403 (R7.2, D2). No plan limit.
 */
@Controller("crm/plugins")
@ApiTags("CRM Plugins")
@ApiSecurity("bearer")
export class CrmPluginController {
  constructor(private readonly plugins: CrmPluginService) {}

  @Get()
  @Roles(...ORG_ROLES)
  list(@OrgId() orgId: string) {
    return this.plugins.list(orgId);
  }

  @Put("order")
  @Roles(...ORG_STAFF)
  reorder(@OrgId() orgId: string, @CurrentUser() user: { _id: string }, @Body() dto: ReorderPluginsDto) {
    return this.plugins.reorder(orgId, dto.keys, user?._id ? String(user._id) : undefined);
  }

  /** `?dryRun=true` returns what would change (the confirm dialog, R7.4). */
  @Patch(":key")
  @Roles(...ORG_STAFF)
  setEnabled(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Param("key") key: string,
    @Body() dto: SetPluginEnabledDto,
    @Query("dryRun") dryRun?: string,
  ) {
    return this.plugins.setEnabled(orgId, key, dto.enabled, user?._id ? String(user._id) : undefined, {
      dryRun: dryRun === "true" || dryRun === "1",
    });
  }
}
