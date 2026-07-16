import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import { Model } from "mongoose";
import { RoleEnum } from "src/agent/enums/agent-role.enum";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { getDaySubtitle } from "src/util/get-subtitle";
import { QUESTION_PROVIDER } from "./constants";
import {
  CreateMultipleQuestionsDto,
  CreateSingleQuestionDto,
} from "./dto/create-question.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { UpdateQuestionStatusDto } from "./dto/update-question-status.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { Question, QuestionDocument } from "./entities/question.entity";
import { QuestionStatusEnum } from "./enums/question-status.enum";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @Inject(QUESTION_PROVIDER)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async createSingleQuestion(
    createQuestionDto: CreateSingleQuestionDto,
    user: JwtPayload
  ): Promise<QuestionDocument> {
    try {
      let question = await this.questionModel.findOne({
        question: createQuestionDto.question,
      });

      // generate intent
      //const intent = await this.getIntent(createQuestionDto.question);

      const status =
        user.role === "admin"
          ? QuestionStatusEnum.APPROVED
          : QuestionStatusEnum.UNDER_REVIEW;

      if (question) {
        question.answers = [...question.answers, ...createQuestionDto.answers];
      } else {
        question = new this.questionModel({
          ...createQuestionDto,
          addedBy: user._id,
          status,
          //intent,
          // intent: response from getintent function
        });
      }

      return await question.save();
    } catch (error) {
      this.logger.error(`Error creating question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async createMultipleQuestions(
    createMultipleQuestionsDto: CreateMultipleQuestionsDto,
    user: JwtPayload
  ): Promise<any> {
    try {
      await Promise.all(
        createMultipleQuestionsDto.questions.map(async (question) => {
          this.createSingleQuestion(
            {
              ...question,
              tags: createMultipleQuestionsDto.tags,
              questionLanguage: createMultipleQuestionsDto.questionLanguage,
            },
            user
          );
        })
      );
      return { message: "Questions added successfully" };
    } catch (error) {
      this.logger.error(`Error creating multiple question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getAllQuestions(
    query?: SearchParamDto
  ): Promise<{ data: QuestionDocument[]; count: number }> {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        status,
        tags,
        language,
        question,
      } = query;

      const queryObject = {};
      if (status) queryObject["status"] = status;
      if (tags) queryObject["tags"] = { $in: tags };
      if (language) queryObject["questionLanguage.label"] = language;
      if (question) queryObject["$text"] = { $search: question };

      const questions = this.questionModel
        .find(queryObject)
        .sort({ createdAt: -1 })
        .populate("addedBy", "name")
        .populate("approvedBy", "name")
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        questions.limit(limitOfDocuments);
      }
      const data = await questions.exec();
      const count = await this.questionModel.countDocuments(queryObject);
      return { data, count };
    } catch (error) {
      this.logger.error(`Error getting all questions: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getQuestionById(id: string): Promise<QuestionDocument> {
    try {
      const question = await this.questionModel.findById(id);
      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      return question;
    } catch (error) {
      this.logger.error(`Error getting question by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateStatus(
    id: string,
    approvedBy: string,
    updateQuestionStatusDto: UpdateQuestionStatusDto
  ): Promise<QuestionDocument> {
    try {
      const status = updateQuestionStatusDto.status;
      const question = await this.questionModel.findById(id);

      if (!question) {
        throw new HttpException("Question not found", 404);
      }

      if (status === QuestionStatusEnum.APPROVED) {
        question.status = status;
        question.approvedBy = approvedBy;
        if (question.addedBy === approvedBy) {
          throw new HttpException("You cannot approve your own question", 400);
        }
      } else {
        question.status = status;
        question.approvedBy = null;
      }

      return await question.save();
    } catch (error) {
      this.logger.error(`Error approving question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async search(question: string, language = "en"): Promise<QuestionDocument[]> {
    try {
      question = question.toLowerCase().trim();
      const query = {
        $text: { $search: question, $language: language },
      };
      const questions = await this.questionModel
        .find(query)
        .sort({ score: { $meta: "textScore" } })
        .select("question answers")
        .limit(10);
      if (questions.length === 0) {
        return [];
      }

      return questions;
    } catch (error) {
      this.logger.error(`Error searching question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateQuestion(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
    user: JwtPayload
  ): Promise<Question> {
    try {
      const { _id: userId, role } = user;
      const question = await this.questionModel.findById(id);
      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      let keywords = [];
      if (updateQuestionDto.question) {
        question.question = updateQuestionDto.question;

        keywords = [...keywords, ...updateQuestionDto.question.split(" ")];
      }
      if (updateQuestionDto.keywords) {
        keywords = [...keywords, ...updateQuestionDto.keywords];
        question.keywords = updateQuestionDto.keywords;
      }
      if (updateQuestionDto.answers) {
        question.answers = updateQuestionDto.answers;
      }
      if (updateQuestionDto.tags) {
        question.tags = updateQuestionDto.tags;
      }

      question.status =
        role === RoleEnum.ADMIN
          ? QuestionStatusEnum.APPROVED
          : QuestionStatusEnum.UNDER_REVIEW;
      question.approvedBy = userId;

      question.questionLanguage = updateQuestionDto.questionLanguage;

      keywords = keywords
        .map((keyword) => {
          return keyword.replace(/[^\w\s]/gi, "");
        })
        .filter((keyword) => {
          return keyword !== "";
        });

      question.search_keywords = [...new Set(keywords)];

      return await question.save();
    } catch (error) {
      this.logger.error(`Error updating question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async deleteQuestion(id: string): Promise<QuestionDocument> {
    try {
      const question = await this.questionModel.findById(id);
      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      return await question.remove();
    } catch (error) {
      this.logger.error(`Error deleting question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAnswer(question: string, language = "english", tags?: string[]) {
    try {
      question = question.toLowerCase().trim();
      const query = {
        $text: { $search: question, $language: language },
        status: QuestionStatusEnum.APPROVED,
      };

      if (tags) {
        query["tags"] = { $all: tags };
      }

      const questionFound = await this.questionModel
        .find(query, {
          score: { $meta: "textScore" },
        })
        .sort({ score: { $meta: "textScore" } })
        .limit(1)
        .select("answers")

        .exec();

      if (!questionFound || !questionFound.length) {
        return null;
      }

      await this.questionModel
        .updateOne({ _id: questionFound[0]._id }, { $inc: { usedcount: 1 } })
        .exec();

      const randomAnswer =
        questionFound[0].answers[
          Math.floor(Math.random() * questionFound[0].answers.length)
        ];
      return randomAnswer;
    } catch (error) {
      this.logger.error(`Error finding answer: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.questionModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total Questions",
      subtitle: getDaySubtitle(days),
      type: "question",
    };
  }

  async getApprovedCount(days = 30) {
    const total = await this.questionModel.countDocuments({
      status: QuestionStatusEnum.APPROVED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        status: QuestionStatusEnum.APPROVED,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Approved Questions",
      subtitle: getDaySubtitle(days),
      type: "question",
    };
  }

  async getUnderReviewCount(days = 30) {
    const total = await this.questionModel.countDocuments({
      status: QuestionStatusEnum.UNDER_REVIEW,
    });

    let percentageChange = 0;

    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        status: QuestionStatusEnum.UNDER_REVIEW,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Under Review Questions",
      subtitle: getDaySubtitle(days),
      type: "question",
    };
  }

  async stats(days = 30) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days),
        this.getApprovedCount(days),
        this.getUnderReviewCount(days),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getIntent(question: string) {
    try {
      const nlpUrl = `${this.configService.get("nlp.url")}/nlp/v1/findIntent`;
      const result = await firstValueFrom(
        this.httpService.get(nlpUrl, {
          params: {
            data: question,
          },
        })
      );

      if (result.data.found) return result.data.Intent;
      else return "";
    } catch (error) {
      this.logger.error(`Error getting intent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
