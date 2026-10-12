import { RequiresFeature } from 'src/common/decorators/requires-feature.decorator';
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
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { AdvertisementQueryParams } from './dto/get-advertisement.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

@Controller('advertisement')
@RequiresFeature('advertisements')
@ApiTags('Advertisement')
@ApiSecurity('bearer')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post()
  @Roles(...ORG_STAFF)
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

  @Get('report/count')
  async advertisementsClickCount(@CurrentUser() user: JwtPayload) {
    return this.advertisementService.findAdvertisementsClickCount(user as any);
  }

  @Get('report/bots-total-clicks')
  async botClicksCountData(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.advertisementService.findBotClicksCount(query, user as any);
  }

  @Get('report/tags-total-clicks')
  async tagsClicksCountData(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.advertisementService.findTagsClicksCount(query, user as any);
  }

  @Get('report/date-wise-performance')
  async advertisementsSummaryStats(
    @Query() query: AdvertisementQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.advertisementService.getDateWisePerformance(query, user as any);
  }

  @Get('report/day-wise-performance')
  async advertisementsDateWiseStats(
    @Query() query: AdvertisementQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.advertisementService.getDayWisePerformance(query, user as any);
  }

  @Get('report/date-wise-compare')
  async advertisementsDateWiseCompare(
    @Query() query: ComparisonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.advertisementService.dateWiseComparison(query, user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.advertisementService.findOne(id, user as any);
  }

  @Patch(':id')
  @Roles(...ORG_STAFF)
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
  @Roles(...ORG_STAFF)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.advertisementService.remove(id, user as any);
  }
}
