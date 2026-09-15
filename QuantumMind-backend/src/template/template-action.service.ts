import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { isValidObjectId, Model } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import {
  TEMPLATE_ACTION_SUBMISSION_PROVIDER,
  TEMPLATE_PROVIDER,
} from './constant';
import { CreateTemplateActionDto } from './dto/create-template-action.dto';
import { SearchTemplateActionDto } from './dto/search-template-action.dto';
import { TemplateActionSubmissionDocument } from './entities/template-action-submission.entity';
import { TemplateDocument } from './entities/template.entity';

type UploadedFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
};

type TemplateActionBody = CreateTemplateActionDto & Record<string, any>;

const CONTEXT_KEYS = [
  'templateId',
  'visitorId',
  'phone',
  'botId',
  'conversationId',
  'platform',
  'requestId',
] as const;

@Injectable()
export class TemplateActionService {
  private readonly logger = new Logger(TemplateActionService.name);

  constructor(
    @Inject(TEMPLATE_ACTION_SUBMISSION_PROVIDER)
    private readonly submissionModel: Model<TemplateActionSubmissionDocument>,
    @Inject(TEMPLATE_PROVIDER)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly uploadService: UploadService,
  ) {}

  /** Splits a raw action body into the known context fields + everything else (the payload). */
  private splitContext(body: TemplateActionBody) {
    const context: Record<string, any> = {};
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if ((CONTEXT_KEYS as readonly string[]).includes(key)) {
        context[key] = value;
      } else {
        payload[key] = value;
      }
    }
    return { context, payload };
  }

  private async assertTemplateExists(templateId: string): Promise<void> {
    // A malformed id would make Mongoose throw a CastError (surfacing as a 500);
    // for a visitor-facing endpoint an unknown template is simply a 404.
    if (!templateId || !isValidObjectId(templateId)) {
      throw new HttpException('Template not found', 404);
    }
    const exists = await this.templateModel.exists({
      _id: templateId,
      isDeleted: false,
    });
    if (!exists) {
      throw new HttpException('Template not found', 404);
    }
  }

  /** Mongo duplicate-key (E11000/11001) — raised by the unique requestId index. */
  private isDuplicateKeyError(error: any): boolean {
    return error?.code === 11000 || error?.code === 11001;
  }

  /**
   * Persists one hosted-template action submission (appointment/form/lead/
   * slot/payment/quote/upload). Idempotent on `requestId` when the caller
   * supplies one - a retried submission for the same template returns the
   * original record instead of creating a duplicate.
   */
  async recordSubmission(actionType: string, body: TemplateActionBody) {
    try {
      await this.assertTemplateExists(body.templateId);

      const { context, payload } = this.splitContext(body);

      if (context.requestId) {
        const existing = await this.submissionModel.findOne({
          templateId: context.templateId,
          requestId: context.requestId,
        });
        if (existing) {
          return {
            ok: true,
            submissionId: existing.id,
            message: 'Submission already recorded',
          };
        }
      }

      let submission;
      try {
        submission = await this.submissionModel.create({
          templateId: context.templateId,
          actionType,
          payload,
          botId: context.botId || '',
          conversationId: context.conversationId || '',
          visitorId: context.visitorId || '',
          phone: context.phone || '',
          platform: context.platform || '',
          requestId: context.requestId || null,
        });
      } catch (error) {
        // Concurrent retries can both pass the check above and race into
        // create(); the unique (templateId, requestId) index makes the loser
        // throw E11000. That's the idempotency guarantee working, not an
        // error — return the row the winner just stored.
        if (this.isDuplicateKeyError(error) && context.requestId) {
          const existing = await this.submissionModel.findOne({
            templateId: context.templateId,
            requestId: context.requestId,
          });
          if (existing) {
            return {
              ok: true,
              submissionId: existing.id,
              message: 'Submission already recorded',
            };
          }
        }
        throw error;
      }

      return {
        ok: true,
        submissionId: submission.id,
        message: 'Submission received',
      };
    } catch (error) {
      this.logger.error(
        `Error recording ${actionType} submission: ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Stores an uploaded file submission and returns its hosted URL alongside the submission id. */
  async recordUpload(body: TemplateActionBody, file?: UploadedFile) {
    if (!file) {
      throw new HttpException('File is required', 400);
    }
    // Validate the template BEFORE persisting the file, so a bad templateId
    // doesn't orphan an upload in storage.
    await this.assertTemplateExists(body.templateId);
    const fileUrl = await this.uploadService.uploadFile(
      file,
      'template-submissions',
    );
    return this.recordSubmission('upload', { ...body, fileUrl });
  }

  /**
   * Placeholder product catalog lookup for templates that need one (e.g. an
   * order/checkout flow). No catalog domain exists yet in this codebase, so
   * this returns an empty list rather than failing the template - replace
   * with a real catalog/product-service call once one exists.
   */
  async listProducts(): Promise<{ data: any[] }> {
    return { data: [] };
  }

  /** Dashboard-facing listing of stored submissions, filterable by template/bot/conversation/actionType. */
  async findAll(query: SearchTemplateActionDto) {
    try {
      const {
        skip = 0,
        limit = 20,
        templateId,
        botId,
        conversationId,
        actionType,
      } = query;

      const queryObj: Record<string, any> = {};
      // Ignore a malformed templateId filter rather than letting the ObjectId
      // CastError turn a filtered listing into a 500.
      if (templateId && isValidObjectId(templateId)) {
        queryObj.templateId = templateId;
      }
      if (botId) queryObj.botId = botId;
      if (conversationId) queryObj.conversationId = conversationId;
      if (actionType) queryObj.actionType = actionType;

      const data = await this.submissionModel
        .find(queryObj)
        .skip(Number(skip))
        .limit(Number(limit))
        .sort({ createdAt: -1 });
      const count = await this.submissionModel.countDocuments(queryObj);

      return { data, count };
    } catch (error) {
      this.logger.error(
        `Error listing template submissions: ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
