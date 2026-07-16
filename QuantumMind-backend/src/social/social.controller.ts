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
import { CreateSocialDto } from './dto/create-social.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateSocialDto } from './dto/update-social.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SocialService } from './social.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';

@Controller('social')
@ApiTags('Social')
@ApiSecurity('bearer')
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly conversationService: ConversationService,
  ) {}

  @Post()
  @Public()
  async create(@Body() createSocialDto: CreateSocialDto) {
    return await this.socialService.create(createSocialDto);
  }

  @Get()
  @Public()
  async findAll(@Query() query: SearchParamDto) {
    return await this.socialService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.socialService.stats();
  }

  @Get('report')
  @Public()
  async getPlatformConversationsStats() {
    return await this.conversationService.TotalCountPlatform();
  }

  @Public()
  @Get('report/date-wise')
  async getDatewisePlatfrom(@Query() query: ReportParamsDto) {
    return await this.conversationService.DateWisePlatform(query);
  }

  @Get('report/day-wise')
  async getDaywisePlatform(@Query() query: ReportParamsDto) {
    return await this.conversationService.DayWisePlatform(query);
  }

  @Public()
  @Get('report/date-wise-comparison')
  async getDateWiseComparison(@Query() query: ComparisonDto) {
    return await this.socialService.dateWiseComparison(query);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.socialService.findOne(id);
  }

  @Patch(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateSocialDto: UpdateSocialDto,
  ) {
    return await this.socialService.update(id, updateSocialDto);
  }

  @Patch(':id/update-status')
  @Public()
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return await this.socialService.updateStatus(id, body.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.socialService.remove(id);
  }
}
