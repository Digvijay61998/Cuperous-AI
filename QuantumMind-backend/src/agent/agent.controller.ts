import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Public } from "src/auth/Public/public.decorator";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";

import { CurrentUser } from "src/util/current-user.decorator";
import { ReportParamsDto } from "src/util/report-params.dto";
import { AgentQueryParams } from "./agent-query.params";
import { AgentService } from "./agent.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@ApiTags("Agent")
@ApiSecurity("bearer")
@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async create(@Body() createAgentDto: CreateAgentDto) {
    return await this.agentService.create(createAgentDto);
  }

  @Public()
  @Get()
  async findAll(@Query() query: AgentQueryParams) {
    return await this.agentService.findAll(query);
  }

  @Get("welcome")
  async welcome(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.welcomeToAgent(agent._id);
  }

  @Get("list")
  async getAgentList() {
    return await this.agentService.agentList();
  }

  @Get("stats")
  async getAgentStats() {
    return await this.agentService.getStats();
  }

  @Get("report/total")
  async getAgentReport() {
    return await this.agentService.getTotalAgent();
  }

  @Get("report/day-wise-performance")
  async dayWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.agentService.dayWisePerformance(query);
  }

  @Get("report/date-wise-performance")
  async dateWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.agentService.dateWiseConversations(query);
  }

  @Get("me")
  async getMe(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.getMe(agent);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.agentService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateAgentDto: UpdateAgentDto
  ) {
    return await this.agentService.update(id, updateAgentDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return await this.agentService.remove(id);
  }
}
