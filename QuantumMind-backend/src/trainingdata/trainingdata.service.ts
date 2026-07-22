import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { TRAINING_DATA_PROVIDER } from "./constants";
import { TrainingDataDocument } from "./entities/training-data.entity";
import FormData = require("form-data");

@Injectable()
export class TrainingDataService {
  private readonly logger = new Logger(TrainingDataService.name);

  constructor(
    @Inject(TRAINING_DATA_PROVIDER)
    private readonly trainingDataModel: Model<TrainingDataDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  private get aiUrl(): string {
    return this.configService.get("ai.url");
  }

  /**
   * Upload files to the AI service for text extraction + ingestion, then save
   * metadata records. Each file is processed independently.
   */
  async uploadFiles(
    botId: string,
    userId: string,
    files: Express.Multer.File[]
  ) {
    const results: TrainingDataDocument[] = [];

    for (const file of files) {
      // Create a "processing" record immediately so the UI can show status.
      const doc = await this.trainingDataModel.create({
        botId,
        userId,
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        source: file.originalname,
        status: "processing",
      });

      try {
        // Forward the file to the AI service (it handles PDF/DOCX/TXT parsing).
        const formData = new FormData();
        formData.append("client_id", botId);
        formData.append("bot_id", botId);
        formData.append("file", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        const res = await firstValueFrom(
          this.httpService.post(`${this.aiUrl}/ingest/file`, formData, {
            headers: formData.getHeaders(),
            timeout: 120000, // PDF parsing can be slow for large files.
          })
        );

        const aiResult = res.data;
        doc.chunksIngested = aiResult.chunks_ingested || 0;
        // Store the extracted text so the UI can offer a "view" action.
        if (aiResult.text) {
          doc.content = aiResult.text;
        }
        doc.status = aiResult.chunks_ingested > 0 ? "completed" : "failed";
        if (!aiResult.chunks_ingested) {
          doc.error = "No text could be extracted from the file";
        }
        await doc.save();

        this.logger.log(
          `Ingested training file ${file.originalname} for bot=${botId} (${doc.chunksIngested} chunks)`
        );
      } catch (error) {
        doc.status = "failed";
        doc.error = error.message || "Unknown error";
        await doc.save();
        this.logger.error(
          `Failed to ingest training file ${file.originalname}: ${error.message}`
        );
      }

      results.push(doc);
    }

    return results;
  }

  /**
   * List all training-data files for a bot. Excludes `content` to keep the
   * payload small; use view() to fetch a single document's text.
   */
  async getByBotId(botId: string) {
    return this.trainingDataModel
      .find({ botId })
      .select("-content")
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Fetch a single training-data record including its extracted text (for the
   * "view" action in the UI).
   */
  async view(id: string) {
    const doc = await this.trainingDataModel.findById(id);
    if (!doc) {
      throw new HttpException("Training data not found", 404);
    }
    return {
      _id: doc._id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      status: doc.status,
      chunksIngested: doc.chunksIngested,
      content: doc.content || "",
    };
  }

  /**
   * List training-data files currently assigned to an AI node.
   */
  async getByNodeId(nodeId: string) {
    return this.trainingDataModel
      .find({ nodeIds: nodeId })
      .select("-content")
      .exec();
  }

  /**
   * Search training-data files for a bot by filename.
   */
  async search(botId: string, search: string) {
    const regex = new RegExp(search, "i");
    return this.trainingDataModel
      .find({ botId, filename: regex })
      .select("-content")
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Assign files to a node (for the AI node modal file picker).
   */
  async assignToNode(fileIds: string[], nodeId: string) {
    await this.trainingDataModel.updateMany(
      { _id: { $in: fileIds } },
      { $addToSet: { nodeIds: nodeId } }
    );
    return { success: true };
  }

  /**
   * Remove a training-data file and its vectors from the knowledge base.
   */
  async remove(id: string) {
    const doc = await this.trainingDataModel.findById(id);
    if (!doc) {
      throw new HttpException("Training data not found", 404);
    }

    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.aiUrl}/ingest/${encodeURIComponent(
            doc.botId
          )}/${encodeURIComponent(doc.source)}`
        )
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete vectors for training file ${doc.filename}: ${error.message}`
      );
    }

    await doc.remove();
    return { success: true, id };
  }
}
