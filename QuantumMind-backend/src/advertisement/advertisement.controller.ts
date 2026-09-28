import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { AdvertisementQueryParams } from './dto/get-advertisement.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';

@Controller('advertisement')
@ApiTags('Advertisement')
@ApiSecurity('bearer')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post()
  async create(
    @Body() createAdvertisementDto: CreateAdvertisementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.advertisementService.create(
      createAdvertisementDto,
      user as any,
    );
  }

  @Get()
  async findAll(@Query() query: SearchParamDto, @CurrentUser() user: JwtPayload) {
    return await this.advertisementService.findAll(query, user as any);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return await this.advertisementService.stats(30, user as any);
  }

  @Public()
  @Get('report/count')
  async advertisementsClickCount() {
    return this.advertisementService.findAdvertisementsClickCount();
  }

  @Public()
  @Get('report/bots-total-clicks')
  async botClicksCountData(@Query() query: SearchParamDto) {
    return this.advertisementService.findBotClicksCount(query);
  }

  @Public()
  @Get('report/tags-total-clicks')
  async tagsClicksCountData(@Query() query: SearchParamDto) {
    return this.advertisementService.findTagsClicksCount(query);
  }

  @Public()
  @Get('report/date-wise-performance')
  @Public()
  async advertisementsSummaryStats(@Query() query: AdvertisementQueryParams) {
    return this.advertisementService.getDateWisePerformance(query);
  }

  @Get('report/day-wise-performance')
  @Public()
  async advertisementsDateWiseStats(@Query() query: AdvertisementQueryParams) {
    return this.advertisementService.getDayWisePerformance(query);
  }

  @Public()
  @Get('report/date-wise-compare')
  async advertisementsDateWiseCompare(@Query() query: ComparisonDto) {
    return this.advertisementService.dateWiseComparison(query);
  }
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.advertisementService.findOne(id, user as any);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.advertisementService.update(
      id,
      updateAdvertisementDto,
      user as any,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.advertisementService.remove(id, user as any);
  }
}
