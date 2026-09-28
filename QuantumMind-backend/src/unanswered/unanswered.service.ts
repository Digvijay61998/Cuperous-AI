import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { Model } from 'mongoose';
import {
  UNANSWERED_PROVIDER_MODEL,
  UNANSWERED_QUESTION_MODEL,
} from './constants';
import { CreateUnansweredDto } from './dto/create-unanswered.dto';
import { UnansweredQuestionDocument } from './entities/unanswered-question.entity';
import { UnansweredDocument } from './entities/unanswered.entity';
import moment from 'moment';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { TenantContext } from 'src/common/tenant/tenant-context';

@Injectable()
export class UnansweredService {
  readonly logger = new Logger(UnansweredService.name);
  constructor(
    @Inject(UNANSWERED_PROVIDER_MODEL)
    private readonly unansweredModel: Model<UnansweredDocument>,

    @Inject(UNANSWERED_QUESTION_MODEL)
    private readonly unansweredQuestionModel: Model<UnansweredQuestionDocument>,

    private readonly tenantScope: TenantScopeService,
  ) {}

  /**
   * Throws 404 when the caller's org does not own the given bot. SUPER_ADMIN
   * (orgBotIds === null) passes. Used to gate bot-scoped reads.
   */
  private async assertBotInOrg(botId: string, user?: TenantContext) {
    const botIds = await this.tenantScope.orgBotIds(user);
    if (botIds === null) return;
    if (!botId || !botIds.some((b) => String(b) === String(botId))) {
      throw new HttpException('No unanswered questions found for this bot', 404);
    }
  }

  async create(unanswered: CreateUnansweredDto): Promise<any> {
    let unansweredQuestions = await this.unansweredModel.findOne({
      botId: unanswered.botId,
    });

    if (!unansweredQuestions) {
      unansweredQuestions = await this.unansweredModel.create({
        botId: unanswered.botId,
      });
    }

    const questions = await this.unansweredQuestionModel.create({
      ...unanswered.questions,
      time: new Date(),
      botid: unanswered.botId,
    });

    unansweredQuestions.questions.push(questions.id);
    return await unansweredQuestions.save();
  }

  async findOne(botId: string, user?: TenantContext): Promise<any> {
    await this.assertBotInOrg(botId, user);
    const questions = await this.unansweredModel
      .findOne({
        botId: botId,
      })
      .populate({
        path: 'questions',
        populate: {
          path: 'askedBy',
          select: 'name email -_id',
        },
        select: 'question time askedBy id',
      });

    if (!questions) {
      return {
        botId: botId,
        questions: [],
      };
    }

    return questions;
  }

  async removeQuestion(questionId: string) {
    try {
      const question = await this.unansweredQuestionModel.deleteOne({
        _id: questionId,
      });
      if (!question) {
        throw new HttpException('Question not found', 404);
      }
      return question;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async getAllQuestionsInCSV(res: Response, botId?: string, user?: TenantContext) {
    try {
      await this.assertBotInOrg(botId, user);
      const questions = await this.unansweredQuestionModel
        .find({
          botid: botId,
        })
        .populate('askedBy', 'name email ')

        .select('question time askedBy');

      const rows = questions.map((question) => {
        return {
          question: question.question,
          time: question.time,
          visitor_name: question.askedBy?.name || '',
          visitor_email: question.askedBy?.email || '',
        };
      });

      const fields = ['question', 'time', 'visitor_name', 'visitor_email'];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=questions.csv',
      );

      res.status(200).send(csv);
    } catch (error) {
      this.logger.error(`Error in getAllQuestionsInCSV: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async homeQuestionCount(filter: any) {
    if (!filter) filter = 'day';
    try {
      const total = await this.unansweredModel.countDocuments({
        createdAt: {
          $gte: new Date(moment().startOf(filter).toISOString()),
        },
      });

      let percentageChange = 0;
      const previousTotal = await this.unansweredModel.countDocuments({
        createdAt: {
          $gte: new Date(
            moment().subtract(1, filter).startOf(filter).toISOString(),
          ),
        },
      });

      if (previousTotal) {
        percentageChange = Math.round(
          ((total - previousTotal) / previousTotal) * 100,
        );
      }

      return {
        stats: total,
        trendNumber: Math.abs(percentageChange),
        trend: percentageChange > 0 ? 'positive' : 'negative',
        title: 'Total Unanswered',

        type: 'service_request',
      };
    } catch (error) {
      this.logger.error(`Error while getting home  count ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
