import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { AllowVisitor } from "src/common/decorators/allow-visitor.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { UploadFileDto } from "./dto/upload-file.dto";
import { UploadService } from "./upload.service";

/** 25 MB — generous for chat attachments, blocks trivial storage abuse. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * File uploads. Previously `@Public()` (anonymous writes to storage). Now any
 * authenticated caller: org users from the dashboard, and widget visitors via
 * their visitor token (chat attachments). Anonymous requests are rejected.
 */
@Controller("file")
@ApiTags("File")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
@AllowVisitor()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } })
  )
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UploadFileDto,
    description: "Upload file",
  })
  async uploadFile(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException("No file provided");
    try {
      return await this.uploadService.uploadFile(file, "docs");
    } catch (e) {
      return {
        error: "Upload failed",
      };
    }
  }

  @Get("signed-url")
  async generateSignedUrl(@Query("mime-type") mimeType: string) {
    return await this.uploadService.generateSignedUrl(mimeType);
  }
}
