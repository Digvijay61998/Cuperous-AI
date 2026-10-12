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
import { QuestionsService } from './questions.service';
import { QuestionDocument } from './entities/question.entity';
import {
  CreateSingleQuestionDto,
  CreateMultipleQuestionsDto,
} from './dto/create-question.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FindAnswerDto } from './dto/find-answer.dto';
import { Public } from 'src/auth/Public/public.decorator';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';

@Controller('questions')
@RequiresFeature('question-bank')
@ApiTags('questions')
@ApiSecurity('bearer')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async createSingleQuestion(
    @Body() createQuestionDto: CreateSingleQuestionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument> {
    return await this.questionsService.createSingleQuestion(
      createQuestionDto,
      user,
    );
  }

  @Post('multiple')
  async createMultipleQuestions(
    @Body() createMultipleQuestionsDto: CreateMultipleQuestionsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument[]> {
    return await this.questionsService.createMultipleQuestions(
      createMultipleQuestionsDto,
      user,
    );
  }

  @Get('search')
  async searchQuestions(
    @Query() { question, language }: FindAnswerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument[]> {
    return await this.questionsService.search(question, language, user as any);
  }

  @Get()
  async getAllQuestions(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: QuestionDocument[]; count: number }> {
    return await this.questionsService.getAllQuestions(query, user as any);
  }

  @Get(':id')
  async getQuestionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument> {
    return await this.questionsService.getQuestionById(id, user as any);
  }

  @Patch(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument> {
    return await this.questionsService.updateQuestion(
      id,
      updateQuestionDto,
      user,
    );
  }

  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuestionDocument> {
    return await this.questionsService.deleteQuestion(id, user as any);
  }

  @Post(':id/approve')
  async approveQuestion(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateStatus: UpdateQuestionStatusDto,
  ): Promise<QuestionDocument> {
    return await this.questionsService.updateStatus(
      id,
      user._id,
      updateStatus,
      user as any,
    );
  }

  @Post('find-answer')
  async findAnswer(
    @Body() findAnswerDto: FindAnswerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.questionsService.findAnswer(
      findAnswerDto.question,
      findAnswerDto.language,
      findAnswerDto.tags,
      user?.organizationId ? String(user.organizationId) : null,
    );
  }

  @Get('report/stats')
  async getReportStats(@CurrentUser() user: JwtPayload) {
    return await this.questionsService.stats(30, user as any);
  }
}
