import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { OrgId } from "src/crm/common/org-id.decorator";
import { CurrentUser } from "src/util/current-user.decorator";
import { CrmLinksService } from "./crm-links.service";

export class LinksQueryDto {
  @IsIn(["conversations", "incidents", "tickets"])
  kind: "conversations" | "incidents" | "tickets";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AddDetailsDto {
  @IsOptional() @IsString() @MaxLength(201) name?: string;
  @IsOptional() @IsString() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
}

@Controller()
@ApiTags("CRM Bridge")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
export class CrmBridgeController {
  constructor(private readonly links: CrmLinksService) {}

  /** R3.3: linked conversations / incidents / tickets, newest first, 50 per page. */
  @Get("crm/contacts/:id/links")
  async contactLinks(@OrgId() orgId: string, @Param("id") id: string, @Query() q: LinksQueryDto) {
    return this.links.listLinks(orgId, id, q.kind, q.skip ?? 0, q.limit ?? 50);
  }

  /** R3.4, R3.8: contact shown in the Agent_View header. */
  @Get("crm/conversations/:id/contact")
  async conversationContact(@OrgId() orgId: string, @Param("id") id: string) {
    return this.links.contactForConversation(orgId, id);
  }

  /** R20.2, R20.3: agent adds details for an anonymous visitor. */
  @Post("crm/conversations/:id/contact/details")
  async addDetails(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: AddDetailsDto,
    @CurrentUser() _user: any,
  ) {
    if (!dto.name?.trim() && !dto.email?.trim() && !dto.phone?.trim()) {
      throw new BadRequestException("Enter a name, email or phone.");
    }
    const res = await this.links.addDetails(orgId, id, dto);
    if (!res) throw new NotFoundException("Conversation not found");
    return res;
  }
}
