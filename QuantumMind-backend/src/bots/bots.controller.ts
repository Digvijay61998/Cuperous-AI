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

@Controller('bots')
@ApiTags('Bots')
@ApiSecurity('bearer')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  async create(@Body() createBotDto: CreateBotDto) {
    return await this.botsService.create(createBotDto);
  }

  @Get()
  async getBots(@Query() query: BotQueryParams) {
    return await this.botsService.getAllBots(query);
  }

  @Get('list')
  async getBotsList() {
    return await this.botsService.botlist();
  }

  @Get('stats')
  async getBotsStats() {
    return await this.botsService.stats();
  }

  @Get('languages')
  async getLanguages() {
    return await this.botsService.getLanguages();
  }

  @Get('report/total')
  async totalReport() {
    return await this.botsService.totalBots();
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

  @Patch(':id')
  async updateBot(@Param('id') id: string, @Body() body: UpdateBotDto) {
    return await this.botsService.update(id, body);
  }

  @Get(':id')
  async getBotById(@Param('id') id: string) {
    return await this.botsService.getBotById(id);
  }

  @Get(':id/setting')
  async getBotSetting(@Param('id') id: string) {
    return await this.botsService.getBotSettingById(id);
  }

  @Patch(':id/setting')
  async updateBotSetting(@Param('id') id: string, @Body() body: any) {
    return await this.botsService.updateBotSetting(id, body);
  }

  @Get(':id/style')
  async getBotStyle(@Param('id') id: string) {
    return await this.botsService.getBotStylesById(id);
  }

  @Patch(':id/style')
  async updateBotStyle(@Param('id') id: string, @Body() body: any) {
    return await this.botsService.updateBotStyle(id, body);
  }

  @Get(':id/flow')
  async getBotFlow(@Param('id') id: string) {
    return await this.botsService.getBotFlow(id);
  }

  @Patch(':id/flow')
  async updateBotFlow(@Param('id') id: string, @Body() body: any) {
    return await this.botsService.updateBotFlow(id, body);
  }

  @Delete(':id')
  async deleteBot(@Param('id') id: string) {
    return await this.botsService.remove(id);
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
