import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  DEFAULT_SESSION_EXPIRY_MINUTES,
  TEMPLATE_SESSION_PROVIDER,
  TEMPLATE_SUBMISSION_PROVIDER,
} from './constant';
import { TemplateSessionDocument } from './entities/template-session.entity';
import { TemplateSubmissionDocument } from './entities/template-submission.entity';
import { TemplateSessionStatusEnum } from './enums/template-session-status.enum';
import { TemplateLaunchService } from './template-launch.service';

interface CreateSessionInput {
  templateId: string;
  templateVersion?: string;
  botId: string;
  nodeId: string;
  visitorId: string;
  conversationId: string;
  platform: string;
  variables: Record<string, any>;
  hostedUrl: string;
  expiryMinutes?: number;
}

interface SubmitInput {
  idempotencyKey?: string;
  data: Record<string, any>;
  attachments?: { url: string; type: string; filename: string }[];
  category?: string;
  industry?: string;
  primaryDate?: Date;
  primaryAmount?: number;
}

@Injectable()
export class TemplateSessionService {
  private readonly logger = new Logger(TemplateSessionService.name);

  constructor(
    @Inject(TEMPLATE_SESSION_PROVIDER)
    private readonly sessionModel: Model<TemplateSessionDocument>,
    @Inject(TEMPLATE_SUBMISSION_PROVIDER)
    private readonly submissionModel: Model<TemplateSubmissionDocument>,
    private readonly launchService: TemplateLaunchService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Create a session + return the customer-facing launch URL. */
  async create(input: CreateSessionInput) {
    const token = this.launchService.generateToken();
    const expiryMinutes = input.expiryMinutes ?? DEFAULT_SESSION_EXPIRY_MINUTES;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

    const session = await this.sessionModel.create({
      templateId: input.templateId,
      templateVersion: input.templateVersion || '1.0.0',
      botId: input.botId,
      nodeId: input.nodeId,
      visitorId: input.visitorId,
      conversationId: input.conversationId,
      platform: input.platform,
      variables: input.variables || {},
      launchToken: token,
      status: TemplateSessionStatusEnum.CREATED,
      launchedAt: new Date(),
      expiresAt,
    });

    const launchUrl = this.launchService.buildUrl(
      input.hostedUrl,
      session.id,
      token,
      input.templateId,
      input.botId,
    );
    return { session, launchUrl };
  }

  async markLaunched(sessionId: string) {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      status: TemplateSessionStatusEnum.LAUNCHED,
    });
  }

  /** The CTA never reached the customer (provider send failed). */
  async markFailed(sessionId: string, reason?: string) {
    this.logger.warn(`Template session ${sessionId} failed to launch: ${reason}`);
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      status: TemplateSessionStatusEnum.FAILED,
    });
  }

  /** Validate token + expiry, return the session for the SDK to render. */
  async getForRuntime(sessionId: string, token: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.launchToken !== token) {
      throw new HttpException('Invalid or expired template session', 401);
    }
    if (session.expiresAt < new Date()) {
      throw new HttpException('This link has expired', 410);
    }
    if (
      [
        TemplateSessionStatusEnum.VALIDATED,
        TemplateSessionStatusEnum.SUBMITTED,
      ].includes(session.status as TemplateSessionStatusEnum)
    ) {
      throw new HttpException('This form has already been submitted', 409);
    }
    return {
      id: session.id,
      templateId: session.templateId,
      variables: session.variables,
      status: session.status,
    };
  }

  /** Heartbeat: distinguishes never-opened (expired) from opened-but-abandoned. */
  async heartbeat(sessionId: string, token: string, phase: 'opened' | 'in_progress') {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.launchToken !== token) {
      throw new HttpException('Invalid template session', 401);
    }
    const update: any = {};
    if (phase === 'opened' && !session.openedAt) {
      update.openedAt = new Date();
      update.status = TemplateSessionStatusEnum.OPENED;
      this.eventEmitter.emit('template.opened', {
        sessionId: session.id,
        templateId: session.templateId,
        visitorId: session.visitorId,
      });
    } else if (phase === 'in_progress') {
      update.status = TemplateSessionStatusEnum.IN_PROGRESS;
    }
    await this.sessionModel.findByIdAndUpdate(sessionId, update);
    return { ok: true };
  }

  /** Customer submits the form. Persists submission, resumes workflow via event. */
  async submit(sessionId: string, token: string, input: SubmitInput) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.launchToken !== token) {
      throw new HttpException('Invalid template session', 401);
    }
    // Duplicate-submission guards.
    if (session.status === TemplateSessionStatusEnum.VALIDATED) {
      return { status: 'accepted', submissionId: session.submissionId, duplicate: true };
    }
    if (
      input.idempotencyKey &&
      session.idempotencyKey === input.idempotencyKey
    ) {
      return { status: 'accepted', submissionId: session.submissionId, duplicate: true };
    }
    if (session.expiresAt < new Date()) {
      throw new HttpException('This session has expired', 410);
    }

    const submission = await this.submissionModel.create({
      templateSessionId: session.id,
      templateId: session.templateId,
      visitorId: session.visitorId,
      botId: session.botId,
      category: input.category || null,
      industry: input.industry || null,
      status: 'confirmed',
      primaryDate: input.primaryDate || null,
      primaryAmount: input.primaryAmount ?? null,
      data: input.data || {},
      attachments: input.attachments || [],
    });

    session.status = TemplateSessionStatusEnum.SUBMITTED;
    session.submittedAt = new Date();
    session.submissionId = submission._id as any;
    session.idempotencyKey = input.idempotencyKey || session.idempotencyKey;
    session.attempts += 1;
    await session.save();

    // Hand off to the workflow engine (message-handler listens for this event).
    this.eventEmitter.emit('template.submitted', {
      sessionId: session.id,
      templateId: session.templateId,
      visitorId: session.visitorId,
      submissionId: submission.id,
      data: submission.data,
    });

    return { status: 'accepted', submissionId: submission.id };
  }

  /** Called by message-handler once the workflow has actually resumed. */
  async markValidated(sessionId: string) {
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      status: TemplateSessionStatusEnum.VALIDATED,
    });
  }

  async findById(sessionId: string) {
    return this.sessionModel.findById(sessionId);
  }

  /** Customer submissions for the timeline / history views. */
  async getSubmissionsByVisitor(visitorId: string, category?: string) {
    const query: any = { visitorId };
    if (category) query.category = category;
    return this.submissionModel.find(query).sort({ createdAt: -1 });
  }

  /**
   * Timeout sweep (#1): every 5 minutes, resolve stale sessions.
   *  - never opened + past expiry  -> EXPIRED  -> workflow routes to FAILURE
   *  - opened but never submitted   -> ABANDONED -> workflow routes to TIMEOUT
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepStaleSessions() {
    const now = new Date();
    const stale = await this.sessionModel.find({
      status: {
        $in: [
          TemplateSessionStatusEnum.CREATED,
          TemplateSessionStatusEnum.LAUNCHED,
          TemplateSessionStatusEnum.OPENED,
          TemplateSessionStatusEnum.IN_PROGRESS,
        ],
      },
      expiresAt: { $lt: now },
    });

    for (const session of stale) {
      const wasOpened = Boolean(session.openedAt);
      session.status = wasOpened
        ? TemplateSessionStatusEnum.ABANDONED
        : TemplateSessionStatusEnum.EXPIRED;
      await session.save();

      this.eventEmitter.emit(
        wasOpened ? 'template.abandoned' : 'template.expired',
        {
          sessionId: session.id,
          templateId: session.templateId,
          visitorId: session.visitorId,
          nodeId: session.nodeId,
        },
      );
    }
    if (stale.length) {
      this.logger.log(`Swept ${stale.length} stale template session(s)`);
    }
  }
}
