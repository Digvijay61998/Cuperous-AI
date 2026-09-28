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
import { Public } from 'src/auth/Public/public.decorator';

import { CreateUnansweredDto } from './dto/create-unanswered.dto';
import { UnansweredService } from './unanswered.service';
import { Response } from 'express';
import { QueryParamDto } from './dto/query-param.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
@Controller('unanswered')
@ApiTags('Unanswered Questions')
@ApiSecurity('bearer')
export class UnansweredController {
  constructor(private readonly unansweredService: UnansweredService) {}

  @Post()
  async create(@Body() createUnansweredDto: CreateUnansweredDto) {
    return await this.unansweredService.create(createUnansweredDto);
  }

  @Get('stats/home')
  @Public()
  async getHomeStats(@Query('time') time: string) {
    return await this.unansweredService.homeQuestionCount(time);
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
  async delete(@Param('questionId') questionId: string) {
    return await this.unansweredService.removeQuestion(questionId);
  }
}
