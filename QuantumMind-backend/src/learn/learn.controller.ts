import { Controller, Get, Inject, NotFoundException, Query } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsMongoId, IsOptional, Max, Min } from "class-validator";
import mongoose, { Connection, Types } from "mongoose";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { CurrentUser } from "src/util/current-user.decorator";
import { AGENT_SHARE_MAX_MONTHS, AGENT_SHARE_TARGET, lastMonths, share } from "./agent-share";

export class AgentShareQueryDto {
  @IsMongoId()
  bot: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AGENT_SHARE_MAX_MONTHS)
  months?: number;
}

/**
 * GET /reports/agent-share?bot=<id>&months=6 (R21.5). Per calendar month
 * (UTC): conversations of the bot, how many had an incident, and the share,
 * with the 1% target. A bot outside the caller's org is a 404.
 */
@Controller("reports")
@ApiTags("Reports")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
export class LearnController {
  constructor(
    private readonly tenantScope: TenantScopeService,
    @Inject(DATABASE_PROVIDER) private readonly mongo: typeof mongoose | Connection,
  ) {}

  @Get("agent-share")
  async agentShare(@Query() q: AgentShareQueryDto, @CurrentUser() user: any) {
    const botIds = await this.tenantScope.orgBotIds(user);
    if (botIds !== null && !botIds.some((b) => String(b) === q.bot)) throw new NotFoundException("Bot not found");
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    const Conversation = conn?.models?.["Conversation"];
    const Incident = conn?.models?.["Incident"];
    const months = lastMonths(q.months ?? 6);
    const rows = await Promise.all(
      months.map(async (m) => {
        const range = { $gte: m.from, $lt: m.to };
        const [conversations, withIncident] = await Promise.all([
          Conversation ? Conversation.countDocuments({ bot: new Types.ObjectId(q.bot), createdAt: range }) : 0,
          // Counted by the incident's conversation, once per conversation.
          Incident ? Incident.distinct("conversationId", { botId: q.bot, createdAt: range }).then((ids: any[]) => ids.length) : 0,
        ]);
        return { month: m.month, conversations, withAgent: withIncident, share: share(withIncident, conversations) };
      }),
    );
    return { bot: q.bot, target: AGENT_SHARE_TARGET, months: rows };
  }
}
