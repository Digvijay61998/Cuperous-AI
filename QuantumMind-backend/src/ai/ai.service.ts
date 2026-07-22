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
