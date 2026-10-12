import { BadRequestException, Body, Controller, Delete, Get, Param, Put } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Allow, IsIn } from "class-validator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES, Role } from "src/common/enums/role.enum";
import { OrgId } from "src/crm/common/org-id.decorator";
import { CurrentUser } from "src/util/current-user.decorator";
import { OVERRIDE_KEYS, OverrideKey } from "./profile-schema";
import { ProfileService } from "./profile.service";

export class SetFactDto {
  @IsIn(OVERRIDE_KEYS as unknown as string[])
  key: OverrideKey;
  /** A list of strings, or a language code / null for facts.language. */
  @Allow()
  value: unknown;
}

const actorOf = (u: any) => String(u?._id ?? u?.userId ?? "");

/**
 * Visitor_Profile on the CRM contact page (crm-incident-handover R18.12).
 * Read: any org user. Edit: org admins only. Org-scoped through the CRM
 * tenant key; another org's contact is a 404.
 */
@Controller("crm/contacts/:id/profile")
@ApiTags("CRM Visitor Profile")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  get(@OrgId() orgId: string, @Param("id") id: string) {
    return this.profiles.getProfile(orgId, id);
  }

  /** Correct a standing fact; the next AI merge keeps it. */
  @Put("facts")
  @Roles(Role.ORG_ADMIN)
  setFact(@OrgId() orgId: string, @Param("id") id: string, @Body() dto: SetFactDto, @CurrentUser() user: any) {
    return this.profiles.setFact(orgId, id, dto.key, dto.value, actorOf(user));
  }

  /** Hand the fact back to the AI. */
  @Delete("facts/:key")
  @Roles(Role.ORG_ADMIN)
  clearFact(@OrgId() orgId: string, @Param("id") id: string, @Param("key") key: string, @CurrentUser() user: any) {
    if (!(OVERRIDE_KEYS as readonly string[]).includes(key)) {
      throw new BadRequestException(`Unknown fact. Use one of: ${OVERRIDE_KEYS.join(", ")}`);
    }
    return this.profiles.clearFact(orgId, id, key as OverrideKey, actorOf(user));
  }

  /** Delete one dated entry (key from the GET response, see entryKey). */
  @Delete("entries/:key")
  @Roles(Role.ORG_ADMIN)
  deleteEntry(@OrgId() orgId: string, @Param("id") id: string, @Param("key") key: string, @CurrentUser() user: any) {
    return this.profiles.removeEntry(orgId, id, key, actorOf(user));
  }
}
