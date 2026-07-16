import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from "@nestjs/swagger";
import * as mime from "mime-types";
import { diskStorage } from "multer";
import { Public } from "src/auth/Public/public.decorator";
import { generateId } from "src/util";
import { UploadFileDto } from "./dto/upload-file.dto";
import { UploadService } from "./upload.service";

@Controller("file")
@ApiTags("File")
@ApiSecurity("bearer")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseInterceptors(FileInterceptor("file"))
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UploadFileDto,
    description: "Upload file",
  })
  @Public()
  async uploadFile(@UploadedFile() file: any) {
    try {
      return await this.uploadService.uploadFile(file, "docs");
    } catch (e) {
      return {
        error: "Upload failed",
      };
    }
  }

  @Get("signed-url")
  @Public()
  async generateSignedUrl(@Query("mime-type") mimeType: string) {
    console.log("mimeType", mimeType);
    return await this.uploadService.generateSignedUrl(mimeType);
  }
}
