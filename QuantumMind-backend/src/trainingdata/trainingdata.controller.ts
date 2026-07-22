import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Public } from "src/auth/Public/public.decorator";
import { TrainingDataService } from "./trainingdata.service";

@Controller("trainingdata")
@ApiTags("Training Data")
export class TrainingDataController {
  constructor(private readonly trainingDataService: TrainingDataService) {}

  /**
   * Upload one or more training-data files for a bot.
   * The AI service extracts text from PDF/DOCX/TXT and ingests into the vector
   * knowledge base. Returns metadata records with status.
   *
   * Frontend sends: multipart/form-data with `userId`, `botId`, and `file` (multiple).
   */
  @Post("upload")
  @Public()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("file", 20)) // up to 20 files at once
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { userId?: string; botId: string }
  ) {
    if (!files || files.length === 0) {
      return { error: "No files provided" };
    }
    if (!body.botId) {
      return { error: "botId is required" };
    }
    return this.trainingDataService.uploadFiles(
      body.botId,
      body.userId || "",
      files
    );
  }

  /**
   * List all training-data files for a bot (used by the AI node modal).
   */
  @Post("bot/:botId")
  @Public()
  async getByBot(@Param("botId") botId: string) {
    return this.trainingDataService.getByBotId(botId);
  }

  /**
   * Get training-data files assigned to a specific AI node.
   */
  @Get("node/:nodeId")
  @Public()
  async getByNode(@Param("nodeId") nodeId: string) {
    return this.trainingDataService.getByNodeId(nodeId);
  }

  /**
   * View a single document's extracted text (for the "view" action).
   */
  @Get("view/:id")
  @Public()
  async view(@Param("id") id: string) {
    return this.trainingDataService.view(id);
  }

  /**
   * Search training-data files by filename for a bot.
   */
  @Post("search")
  @Public()
  async search(@Body() body: { botId: string; search: string }) {
    return this.trainingDataService.search(body.botId, body.search || "");
  }

  /**
   * Assign files to an AI node (used when saving the AI node modal).
   */
  @Post("assign-node")
  @Public()
  async assignToNode(@Body() body: { fileIds: string[]; nodeId: string }) {
    return this.trainingDataService.assignToNode(body.fileIds, body.nodeId);
  }

  /**
   * Delete a training-data file and remove its vectors from the knowledge base.
   */
  @Delete(":id")
  @Public()
  async remove(@Param("id") id: string) {
    return this.trainingDataService.remove(id);
  }
}
