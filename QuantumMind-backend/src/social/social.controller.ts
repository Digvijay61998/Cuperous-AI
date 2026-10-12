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
import { CreateSocialDto } from './dto/create-social.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SocialService } from './social.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

/**
 * Social Messengers tab (channel connections). Authenticated, ORG_ADMIN /
 * ORG_MANAGER only, and org-scoped. Connecting a platform consumes a
 * `maxPlatforms` slot and requires the platform's channel feature.
 * Inbound webhooks live in the per-channel modules and stay public.
 */
@Controller('social')
@ApiTags('Social')
@ApiSecurity('bearer')
@Roles(...ORG_STAFF)
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly conversationService: ConversationService,
  ) {}

  @Post()
  async create(
    @Body() createSocialDto: CreateSocialDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.socialService.create(createSocialDto, user);
  }

  @Get()
  async findAll(
    @Query() query: SearchParamDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.socialService.findAll(query, user);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: TenantContext) {
    return await this.socialService.stats(30, user);
  }

  @Get('report')
  async getPlatformConversationsStats(@CurrentUser() user: TenantContext) {
    return await this.conversationService.TotalCountPlatform(
      await this.conversationService.reportScope(user),
    );
  }

  @Get('report/date-wise')
  async getDatewisePlatfrom(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.conversationService.DateWisePlatform(
      query,
      await this.conversationService.reportScope(user),
    );
  }

  @Get('report/day-wise')
  async getDaywisePlatform(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.conversationService.DayWisePlatform(
      query,
      await this.conversationService.reportScope(user),
    );
  }

  @Get('report/date-wise-comparison')
  async getDateWiseComparison(
    @Query() query: ComparisonDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.socialService.dateWiseComparison(query, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return await this.socialService.findOne(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSocialDto: UpdateSocialDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.socialService.update(id, updateSocialDto, user);
  }

  @Patch(':id/update-status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
    @CurrentUser() user: TenantContext,
  ) {
    return await this.socialService.updateStatus(id, body.status, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return await this.socialService.remove(id, user);
  }
}
