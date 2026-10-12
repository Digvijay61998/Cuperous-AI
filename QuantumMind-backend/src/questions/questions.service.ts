import { HttpException, Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { isValidObjectId, Model } from "mongoose";
import { Role } from "src/common/enums/role.enum";
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
import { LearnedSource, Question, QuestionDocument } from "./entities/question.entity";

/** A learned entry was edited or its status changed: `{ questionId }`. */
export const QUESTION_CHANGED = "question.learned.changed";
/** A learned entry was deleted: `{ questionId, source }`. */
export const QUESTION_DELETED = "question.learned.deleted";
import { QuestionStatusEnum } from "./enums/question-status.enum";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import {
  assertOwnership,
  scopedFilter,
  TenantContext,
} from "src/common/tenant/tenant-context";
@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @Inject(QUESTION_PROVIDER)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    // Optional so older harnesses still construct the service.
    @Optional() private readonly eventEmitter?: EventEmitter2
  ) {}

  /** A learned entry changed: its knowledge-base copy must follow (R21.4). */
  private emitChanged(q: QuestionDocument) {
    if ((q as any)?.source?.kind !== "incident") return;
    this.eventEmitter?.emit(QUESTION_CHANGED, { questionId: String(q._id) });
  }

  // ------------------------------------------------ learned entries (R21)

  /**
   * The system-generated path (R21.1): stored `approved` straight away. This
   * is the only write that skips the human approval step; there is no
   * self-approval because no person approves it.
   */
  async createLearned(data: {
    organizationId: string;
    question: string;
    answer: string;
    addedBy?: string;
    source: LearnedSource;
  }): Promise<QuestionDocument> {
    const q = new this.questionModel({
      organizationId: data.organizationId,
      question: data.question,
      answers: [data.answer],
      keywords: [],
      tags: [],
      status: QuestionStatusEnum.APPROVED,
      addedBy: isValidObjectId(data.addedBy) ? data.addedBy : undefined,
      source: { ...data.source, systemApproved: true },
    });
    return q.save();
  }

  /** Same question text in the org (the schema stores it lower-cased). */
  async findSameQuestion(organizationId: string, question: string) {
    return this.questionModel.findOne({ organizationId, question: String(question).toLowerCase() });
  }

  async findByKnowledgeSource(organizationId: string, knowledgeSource: string) {
    return this.questionModel.findOne({ organizationId, "source.knowledgeSource": knowledgeSource });
  }

  async findLearnedById(id: string) {
    return isValidObjectId(id) ? this.questionModel.findById(id) : null;
  }

  /**
   * R21.3: a near-duplicate keeps one entry with every incident as a source.
   * The new answer is added when it says something new (at most 5 answers).
   */
  async addIncidentToLearned(
    id: string,
    incident: { id: string; ticketId?: string; ticketRef?: string },
    answer: string
  ): Promise<QuestionDocument | null> {
    const q: any = await this.questionModel.findById(id);
    if (!q) return null;
    const src = { ...(q.source || {}) };
    src.incidentIds = [...new Set([...(src.incidentIds || []), incident.id])];
    const known = (src.incidents || []).some((i: any) => i.id === incident.id);
    src.incidents = known ? src.incidents : [...(src.incidents || []), incident];
    q.source = src;
    q.markModified("source");
    const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    if (!q.answers.some((a: string) => norm(a) === norm(answer)) && q.answers.length < 5) {
      q.answers = [...q.answers, answer];
    }
    return q.save();
  }

  /** Knowledge-base sync state for the Question Bank list (R12.8). */
  async setIngestState(id: string, state: { status: string; error?: string }) {
    if (!isValidObjectId(id)) return;
    await this.questionModel.updateOne(
      { _id: id, "source.kind": "incident" },
      { $set: { "source.ingest": { status: state.status, at: new Date(), ...(state.error ? { error: state.error.slice(0, 300) } : {}) } } }
    );
  }

  async createSingleQuestion(
    createQuestionDto: CreateSingleQuestionDto,
    user: JwtPayload
  ): Promise<QuestionDocument> {
    try {
      const organizationId = (user?.organizationId as any) ?? null;
      // Dedup within the caller's own org — the same question text in another
      // tenant must not collide with (or leak into) this one.
      let question = await this.questionModel.findOne({
        question: createQuestionDto.question,
        organizationId,
      });

      // generate intent
      //const intent = await this.getIntent(createQuestionDto.question);

      const status =
        user.role === Role.ORG_ADMIN
          ? QuestionStatusEnum.APPROVED
          : QuestionStatusEnum.UNDER_REVIEW;

      if (question) {
        question.answers = [...question.answers, ...createQuestionDto.answers];
      } else {
        question = new this.questionModel({
          ...createQuestionDto,
          addedBy: user._id,
          organizationId,
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
    query?: SearchParamDto,
    user?: TenantContext
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

      const queryObject: Record<string, any> = {};
      if (status) queryObject["status"] = status;
      if (tags) queryObject["tags"] = { $in: tags };
      if (language) queryObject["questionLanguage.label"] = language;
      if (question) queryObject["$text"] = { $search: question };

      const scoped = scopedFilter(user, queryObject);
      const questions = this.questionModel
        .find(scoped)
        .sort({ createdAt: -1 })
        .populate("addedBy", "name")
        .populate("approvedBy", "name")
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        questions.limit(limitOfDocuments);
      }
      const data = await questions.exec();
      const count = await this.questionModel.countDocuments(scoped);
      return { data, count };
    } catch (error) {
      this.logger.error(`Error getting all questions: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getQuestionById(id: string, user?: TenantContext): Promise<QuestionDocument> {
    try {
      const question = await this.questionModel.findById(id);
      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      assertOwnership(user, question as any);
      return question;
    } catch (error) {
      this.logger.error(`Error getting question by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateStatus(
    id: string,
    approvedBy: string,
    updateQuestionStatusDto: UpdateQuestionStatusDto,
    user?: TenantContext
  ): Promise<QuestionDocument> {
    try {
      const status = updateQuestionStatusDto.status;
      const question = await this.questionModel.findById(id);

      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      assertOwnership(user, question as any);

      if (status === QuestionStatusEnum.APPROVED) {
        // Compared as strings: `addedBy` is an ObjectId, so the old `===`
        // against the caller's id string never matched and anyone could
        // approve their own entry. Learned entries never pass through here;
        // they are approved by the system (R21.1).
        if (question.addedBy && String(question.addedBy) === String(approvedBy)) {
          throw new HttpException("You cannot approve your own question", 400);
        }
        question.status = status;
        question.approvedBy = approvedBy;
      } else {
        question.status = status;
        question.approvedBy = null;
      }

      const saved = await question.save();
      this.emitChanged(saved);
      return saved;
    } catch (error) {
      this.logger.error(`Error approving question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async search(
    question: string,
    language = "en",
    user?: TenantContext
  ): Promise<QuestionDocument[]> {
    try {
      question = String(question ?? "").toLowerCase().trim();
      if (!question) return [];
      const query = scopedFilter(user, {
        $text: { $search: question, $language: language },
      } as Record<string, any>);
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
      assertOwnership(user as any, question as any);
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
        role === Role.ORG_ADMIN
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

      const saved = await question.save();
      this.emitChanged(saved);
      return saved;
    } catch (error) {
      this.logger.error(`Error updating question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async deleteQuestion(id: string, user?: TenantContext): Promise<QuestionDocument> {
    try {
      const question = await this.questionModel.findById(id);
      if (!question) {
        throw new HttpException("Question not found", 404);
      }
      assertOwnership(user, question as any);
      const source = question.source ? { ...(question as any).toObject?.().source ?? question.source } : undefined;
      const removed = await question.remove();
      if (source?.kind === "incident") {
        this.eventEmitter?.emit(QUESTION_DELETED, { questionId: String(question._id), source });
      }
      return removed;
    } catch (error) {
      this.logger.error(`Error deleting question: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * @param organizationId the tenant whose question bank to search. REQUIRED
   * for a result: without an org nothing is returned (fail closed).
   */
  async findAnswer(
    question: string,
    language = "english",
    tags?: string[],
    organizationId?: string | null
  ) {
    try {
      if (!organizationId) return null;
      question = String(question ?? "").toLowerCase().trim();
      if (!question) return null;
      const query: Record<string, any> = {
        $text: { $search: question, $language: language },
        status: QuestionStatusEnum.APPROVED,
        organizationId,
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

  async getTotalCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {});
    const total = await this.questionModel.countDocuments(scoped);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        ...scoped,
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

  async getApprovedCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {
      status: QuestionStatusEnum.APPROVED,
    });
    const total = await this.questionModel.countDocuments(scoped);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        ...scoped,
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

  async getUnderReviewCount(days = 30, user?: TenantContext) {
    const scoped = scopedFilter(user, {
      status: QuestionStatusEnum.UNDER_REVIEW,
    });
    const total = await this.questionModel.countDocuments(scoped);

    let percentageChange = 0;

    if (total) {
      const agoCount = await this.questionModel.countDocuments({
        ...scoped,
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

  async stats(days = 30, user?: TenantContext) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days, user),
        this.getApprovedCount(days, user),
        this.getUnderReviewCount(days, user),
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
