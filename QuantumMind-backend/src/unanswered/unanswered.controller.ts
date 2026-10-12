import { RequiresFeature } from 'src/common/decorators/requires-feature.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

import { CreateUnansweredDto } from './dto/create-unanswered.dto';
import { UnansweredService } from './unanswered.service';
import { Response } from 'express';
import { QueryParamDto } from './dto/query-param.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

/** Unanswered questions (Question Bank tab). ORG_ADMIN / ORG_MANAGER, org-scoped. */
@Controller('unanswered')
@RequiresFeature('question-bank')
@ApiTags('Unanswered Questions')
@ApiSecurity('bearer')
@Roles(...ORG_STAFF)
export class UnansweredController {
  constructor(
    private readonly unansweredService: UnansweredService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Post()
  async create(
    @Body() createUnansweredDto: CreateUnansweredDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.tenantScope.assertBotInOrg(
      user as any,
      createUnansweredDto?.botId,
    );
    return await this.unansweredService.create(createUnansweredDto);
  }

  @Get('stats/home')
  async getHomeStats(
    @Query('time') time: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.unansweredService.homeQuestionCount(time, user as any);
  }

  @Get('download')
  async download(
    @Res() res: Response,
    @Query() query: QueryParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.unansweredService.getAllQuestionsInCSV(
      res,
      query.botId,
      user as any,
    );
  }

  @Get(':botId')
  async findByBotId(
    @Param('botId') botId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.unansweredService.findOne(botId, user as any);
  }

  @Delete(':questionId')
  async delete(
    @Param('questionId') questionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.unansweredService.removeQuestion(questionId, user as any);
  }
}
