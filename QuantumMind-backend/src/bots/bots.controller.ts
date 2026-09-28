import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { BotQueryParams } from './dto/search-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('bots')
@ApiTags('Bots')
@ApiSecurity('bearer')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post()
  async create(
    @Body() createBotDto: CreateBotDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.create(createBotDto, user);
  }

  @Get()
  async getBots(
    @Query() query: BotQueryParams,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getAllBots(query, user);
  }

  @Get('list')
  async getBotsList(@CurrentUser() user: TenantContext) {
    return await this.botsService.botlist(user);
  }

  @Get('stats')
  async getBotsStats(@CurrentUser() user: TenantContext) {
    return await this.botsService.stats(user);
  }

  @Get('languages')
  async getLanguages() {
    return await this.botsService.getLanguages();
  }

  @Get('report/total')
  async totalReport(@CurrentUser() user: TenantContext) {
    return await this.botsService.totalBots(user);
  }

  @Public()
  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.botsService.dayWisePerformance(query);
  }

  @Public()
  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.botsService.dateWiseConversations(query);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch(':id')
  async updateBot(
    @Param('id') id: string,
    @Body() body: UpdateBotDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.update(id, body, user);
  }

  @Get(':id')
  async getBotById(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return await this.botsService.getBotById(id, user);
  }

  @Get(':id/setting')
  async getBotSetting(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getBotSettingById(id, user);
  }

  @Patch(':id/setting')
  async updateBotSetting(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.updateBotSetting(id, body, user);
  }

  @Get(':id/style')
  async getBotStyle(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getBotStylesById(id, user);
  }

  @Patch(':id/style')
  async updateBotStyle(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.updateBotStyle(id, body, user);
  }

  @Get(':id/flow')
  async getBotFlow(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getBotFlow(id, user);
  }

  @Patch(':id/flow')
  async updateBotFlow(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.updateBotFlow(id, body, user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete(':id')
  async deleteBot(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.remove(id, user);
  }

  @Get('flow/node/:id')
  async getBotNodeForApi(@Param('id') id: string) {
    return await this.botsService.getBotNodeForApi(id);
  }

  @Patch('flow/node/:id')
  async updateBotFlowNode(@Param('id') id: string, @Body() body: any) {
    return await this.botsService.updateNode(id, body);
  }

  @Delete('flow/node/:id')
  async deleteBotFlowNode(@Param('id') id: string) {
    return await this.botsService.removeNode(id);
  }
}
