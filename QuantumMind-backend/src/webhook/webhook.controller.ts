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

import { CreateWebhookDto } from './dto/create-webhook.dto';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookService } from './webhook.service';

@ApiTags('Webhook')
@Controller('webhook')
@ApiSecurity('bearer')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async create(@Body() createWebhookDto: CreateWebhookDto) {
    return await this.webhookService.create(createWebhookDto);
  }

  @Get()
  async findAll() {
    return await this.webhookService.getAllWebhooks();
  }

  @Get('list')
  async list() {
    return await this.webhookService.webhookList();
  }

  @Get('stats')
  async getStats() {
    return await this.webhookService.stats();
  }

  @Get('report/total')
  async getReport() {
    return await this.webhookService.totalWebhookReport();
  }

  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.webhookService.dayWisePerformance(query);
  }

  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.webhookService.dateWisePerformance(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.webhookService.getWebhook(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return await this.webhookService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.webhookService.remove(id);
  }

  @Get('test/:id')
  async testWebhook(@Param('id') id: string) {
    return await this.webhookService.testwebhook(id);
  }
}
