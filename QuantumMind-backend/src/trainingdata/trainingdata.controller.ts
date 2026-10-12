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
import { ApiConsumes, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/util/current-user.decorator";
import { TenantContext } from "src/common/tenant/tenant-context";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_STAFF } from "src/common/enums/role.enum";
import { TrainingDataService } from "./trainingdata.service";

/**
 * Bot knowledge-base files (Bots tab -> AI node / bot settings).
 *
 * Previously every route was `@Public()`: anyone could upload into, read the
 * extracted text of, or delete any tenant's training data. Now ORG_ADMIN /
 * ORG_MANAGER only, and every call is checked against the caller's org bots.
 */
@Controller("trainingdata")
@ApiTags("Training Data")
@ApiSecurity("bearer")
@Roles(...ORG_STAFF)
export class TrainingDataController {
  constructor(private readonly trainingDataService: TrainingDataService) {}

  /** Upload one or more training-data files for a bot (multipart `file`). */
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("file", 20))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { botId: string },
    @CurrentUser() user: TenantContext
  ) {
    if (!files || files.length === 0) {
      return { error: "No files provided" };
    }
    if (!body?.botId) {
      return { error: "botId is required" };
    }
    // The uploader is always the authenticated user (never client-supplied).
    return this.trainingDataService.uploadFiles(
      body.botId,
      String(user._id),
      files,
      user
    );
  }

  @Post("bot/:botId")
  async getByBot(
    @Param("botId") botId: string,
    @CurrentUser() user: TenantContext
  ) {
    return this.trainingDataService.getByBotId(botId, user);
  }

  @Get("node/:nodeId")
  async getByNode(
    @Param("nodeId") nodeId: string,
    @CurrentUser() user: TenantContext
  ) {
    return this.trainingDataService.getByNodeId(nodeId, user);
  }

  @Get("view/:id")
  async view(@Param("id") id: string, @CurrentUser() user: TenantContext) {
    return this.trainingDataService.view(id, user);
  }

  @Post("search")
  async search(
    @Body() body: { botId: string; search: string },
    @CurrentUser() user: TenantContext
  ) {
    return this.trainingDataService.search(
      body?.botId,
      body?.search || "",
      user
    );
  }

  @Post("assign-node")
  async assignToNode(
    @Body() body: { fileIds: string[]; nodeId: string },
    @CurrentUser() user: TenantContext
  ) {
    return this.trainingDataService.assignToNode(
      body?.fileIds,
      body?.nodeId,
      user
    );
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: TenantContext) {
    return this.trainingDataService.remove(id, user);
  }
}
