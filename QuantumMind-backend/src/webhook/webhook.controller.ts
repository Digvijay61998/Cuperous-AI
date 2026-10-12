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
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { CurrentUser } from 'src/util';

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
  @Roles(...ORG_STAFF)
  async create(
    @Body() createWebhookDto: CreateWebhookDto,
    @CurrentUser() user: any,
  ) {
    return await this.webhookService.create(
      createWebhookDto,
      user as TenantContext,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return await this.webhookService.getAllWebhooks(user as TenantContext);
  }

  @Get('list')
  async list(@CurrentUser() user: any) {
    return await this.webhookService.webhookList(user as TenantContext);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return await this.webhookService.stats(undefined, user as TenantContext);
  }

  @Get('report/total')
  async getReport(@CurrentUser() user: any) {
    return await this.webhookService.totalWebhookReport(
      user as TenantContext,
    );
  }

  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: any,
  ) {
    return await this.webhookService.dayWisePerformance(
      query,
      user as TenantContext,
    );
  }

  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: any,
  ) {
    return await this.webhookService.dateWisePerformance(
      query,
      user as TenantContext,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.webhookService.getWebhook(id, user as TenantContext);
  }

  @Patch(':id')
  @Roles(...ORG_STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @CurrentUser() user: any,
  ) {
    return await this.webhookService.update(
      id,
      updateWebhookDto,
      user as TenantContext,
    );
  }

  @Delete(':id')
  @Roles(...ORG_STAFF)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.webhookService.remove(id, user as TenantContext);
  }

  @Get('test/:id')
  @Roles(...ORG_STAFF)
  async testWebhook(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.webhookService.testwebhook(id, user as TenantContext);
  }
}
