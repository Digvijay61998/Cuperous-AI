import { HttpService } from "@nestjs/axios";
import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { Model } from "mongoose";
import { firstValueFrom } from "rxjs";
import { generateId } from "src/util";
import { AI_USAGE_PROVIDER, KNOWLEDGE_PROVIDER } from "./constants";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";
import { AiUsageDocument } from "./entities/ai-usage.entity";
import { KnowledgeEntryDocument } from "./entities/knowledge-entry.entity";
import {
  ExtractContactResponse,
  KnowledgeCandidateRequest,
  KnowledgeCandidateResponse,
  KnowledgeSimilarRequest,
  KnowledgeSimilarResponse,
  ProfileMergeRequest,
  ProfileMergeResponse,
  ServiceRequestSummaryRequest,
  ServiceRequestSummaryResponse,
} from "./ai-crm.types";

/** Per-call timeout for the CRM AI endpoints (LLM-backed, so generous). */
export const AI_CRM_TIMEOUT_MS = 60_000;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(KNOWLEDGE_PROVIDER)
    private readonly knowledgeModel: Model<KnowledgeEntryDocument>,
    @Inject(AI_USAGE_PROVIDER)
    private readonly usageModel: Model<AiUsageDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  private get aiUrl(): string {
    return this.configService.get("ai.url");
  }

  // ------------------------------------------------------------- knowledge
  /**
   * Add (or replace) a manual knowledge entry: push the text into the AI vector
   * store and upsert the index record. Re-using a `source` replaces the prior
   * chunks on the AI side and updates the existing record.
   */
  async addKnowledge(dto: CreateKnowledgeDto) {
    const source = dto.source || generateId("knowledge", 10);

    try {
      await firstValueFrom(
        this.httpService.post(`${this.aiUrl}/ingest/text`, {
          client_id: dto.clientId,
          bot_id: dto.botId || null,
          text: dto.content,
          source,
          source_type: "manual",
        })
      );
    } catch (error) {
      this.logger.error(`Knowledge ingest failed: ${error.message}`);
      throw new HttpException(
        `Failed to add knowledge: ${error.message}`,
        error.status || 500
      );
    }

    const entry = await this.knowledgeModel.findOneAndUpdate(
      { clientId: dto.clientId, source },
      {
        clientId: dto.clientId,
        botId: dto.botId,
        source,
        title: dto.title,
        content: dto.content,
        sourceType: "manual",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return entry;
  }

  async getKnowledge(clientId: string) {
    return this.knowledgeModel
      .find({ clientId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async removeKnowledge(id: string) {
    const entry = await this.knowledgeModel.findById(id);
    if (!entry) {
      throw new HttpException("Knowledge entry not found", 404);
    }

    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.aiUrl}/ingest/${encodeURIComponent(
            entry.clientId
          )}/${encodeURIComponent(entry.source)}`
        )
      );
    } catch (error) {
      this.logger.error(`Knowledge delete on AI service failed: ${error.message}`);
      throw new HttpException(
        `Failed to delete knowledge: ${error.message}`,
        error.status || 500
      );
    }

    await entry.remove();
    return { success: true, id };
  }

  /**
   * Remove one knowledge source by name (learned entries, R21.4). Idempotent:
   * a source that is already gone is a success. Throws on an AI error so the
   * caller can retry.
   */
  async removeKnowledgeSource(clientId: string, source: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.aiUrl}/ingest/${encodeURIComponent(clientId)}/${encodeURIComponent(source)}`
        )
      );
    } catch (error) {
      if (error?.response?.status !== 404) {
        this.logger.error(`Knowledge source delete failed: ${error.message}`);
        throw error;
      }
    }
    await this.knowledgeModel.deleteMany({ clientId, source });
  }

  // ------------------------------------------------------- CRM AI endpoints
  // Server-side implementations land in P2 (extract), P7 (profile) and P8
  // (knowledge). Until then the AI service 404s and callers treat any thrown
  // error as "AI unavailable" and fall back (keep chats / skip auto-learn).

  /** Fold one finished conversation into the rolling Visitor_Profile (R18). */
  profileMerge(req: ProfileMergeRequest): Promise<ProfileMergeResponse> {
    return this.postAi<ProfileMergeResponse>("/profile/merge", req);
  }

  /** Turn an agent resolution into a generalised, PII-free Q&A (R21.1). */
  knowledgeCandidate(
    req: KnowledgeCandidateRequest
  ): Promise<KnowledgeCandidateResponse> {
    return this.postAi<KnowledgeCandidateResponse>("/knowledge/candidate", req);
  }

  /** Best match among existing `incident:*` knowledge sources (R21.3). */
  knowledgeSimilar(
    req: KnowledgeSimilarRequest
  ): Promise<KnowledgeSimilarResponse> {
    return this.postAi<KnowledgeSimilarResponse>("/knowledge/similar", {
      source_prefix: "incident:",
      ...req,
    });
  }

  /** Agent-facing summary of one service request (crm-plugins-service-desk R15). */
  serviceRequestSummary(req: ServiceRequestSummaryRequest): Promise<ServiceRequestSummaryResponse> {
    return this.postAi<ServiceRequestSummaryResponse>("/generate/service-request-summary", req);
  }

  /** Pull name/email/phone out of free text when regexes are ambiguous (R16.5). */
  extractContact(text: string): Promise<ExtractContactResponse> {
    return this.postAi<ExtractContactResponse>("/extract/contact", { text });
  }

  private async postAi<T>(path: string, body: unknown): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.httpService.post<T>(`${this.aiUrl}${path}`, body, {
          timeout: AI_CRM_TIMEOUT_MS,
        })
      );
      return res.data;
    } catch (error) {
      this.logger.warn(`AI ${path} failed: ${error?.message}`);
      throw error;
    }
  }

  // ----------------------------------------------------------- usage / billing
  /**
   * Persist a usage record whenever the AI_RESPONSE node produces an answer.
   * Emitted by the message handler as `ai.response.generated`.
   */
  @OnEvent("ai.response.generated", { async: true })
  async recordUsage(event: {
    clientId: string;
    botId?: string;
    visitorId?: string;
    conversationId?: string;
    question?: string;
    tokensUsed?: number;
    provider?: string;
    model?: string;
  }) {
    try {
      await this.usageModel.create({
        clientId: event.clientId,
        botId: event.botId,
        visitorId: event.visitorId,
        conversationId: event.conversationId,
        question: event.question,
        tokensUsed: event.tokensUsed || 0,
        provider: event.provider,
        model: event.model,
      });
    } catch (error) {
      this.logger.error(`Failed to record AI usage: ${error.message}`);
    }
  }

  /**
   * Usage summary + recent records for a client (billing dashboard).
   */
  async getUsage(clientId: string, limit = 100) {
    const [records, totals] = await Promise.all([
      this.usageModel
        .find({ clientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec(),
      this.usageModel.aggregate([
        { $match: { clientId } },
        {
          $group: {
            _id: "$clientId",
            totalRequests: { $sum: 1 },
            totalTokens: { $sum: "$tokensUsed" },
          },
        },
      ]),
    ]);

    const summary = totals[0] || { totalRequests: 0, totalTokens: 0 };
    return {
      clientId,
      totalRequests: summary.totalRequests,
      totalTokens: summary.totalTokens,
      records,
    };
  }
}
