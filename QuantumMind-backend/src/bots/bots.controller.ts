import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { BotQueryParams } from './dto/search-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_ROLES, ORG_STAFF } from 'src/common/enums/role.enum';

/** Bot export files are plain JSON; 5 MB covers several hundred-node flows. */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

/**
 * Bots tab. Configuration is ORG_ADMIN / ORG_MANAGER only (class default);
 * a few read endpoints (bot pickers, bot names in the inbox) are open to all
 * org roles. Every call is org-scoped in BotsService.
 */
@Controller('bots')
@ApiTags('Bots')
@ApiSecurity('bearer')
@Roles(...ORG_STAFF)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  async create(
    @Body() createBotDto: CreateBotDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.create(createBotDto, user);
  }

  /**
   * Exports the given bots (flow, settings, style) as JSON. The dashboard
   * downloads the response as bots.json; the same file can be re-imported.
   */
  @Post('export')
  async exportBots(
    @Body('botIds') botIds: string[],
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.exportBots(botIds, user);
  }

  /**
   * Imports bots from an uploaded JSON file: either a file produced by
   * POST /bots/export, or a bare flow file `{ nodes, edges, customAttributes }`.
   * Each imported bot is created as a new bot with fresh node ids.
   */
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_BYTES } }),
  )
  async importBots(
    @UploadedFile() file: any,
    @CurrentUser() user: TenantContext,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No JSON file provided');
    }
    let parsed: any;
    try {
      parsed = JSON.parse(file.buffer.toString('utf8'));
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }
    const fallbackName = String(file.originalname || 'Imported bot').replace(
      /\.json$/i,
      '',
    );
    return await this.botsService.importBots(parsed, fallbackName, user);
  }

  @Get()
  async getBots(
    @Query() query: BotQueryParams,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getAllBots(query, user);
  }

  @Roles(...ORG_ROLES)
  @Get('list')
  async getBotsList(@CurrentUser() user: TenantContext) {
    return await this.botsService.botlist(user);
  }

  @Get('stats')
  async getBotsStats(@CurrentUser() user: TenantContext) {
    return await this.botsService.stats(user);
  }

  @Roles(...ORG_ROLES)
  @Get('languages')
  async getLanguages() {
    return await this.botsService.getLanguages();
  }

  @Get('report/total')
  async totalReport(@CurrentUser() user: TenantContext) {
    return await this.botsService.totalBots(user);
  }

  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.dayWisePerformance(query, user);
  }

  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.dateWiseConversations(query, user);
  }

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

  @Delete(':id')
  async deleteBot(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.remove(id, user);
  }

  @Get('flow/node/:id')
  async getBotNodeForApi(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.getBotNodeForApi(id, user);
  }

  @Patch('flow/node/:id')
  async updateBotFlowNode(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.updateNode(id, body, user);
  }

  @Delete('flow/node/:id')
  async deleteBotFlowNode(
    @Param('id') id: string,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.botsService.removeNode(id, user);
  }
}
