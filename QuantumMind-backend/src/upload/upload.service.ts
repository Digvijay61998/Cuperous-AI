import { Injectable, Logger, HttpException } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { S3 } from "aws-sdk";
import * as fs from "fs";
import * as mime from "mime-types";
import * as path from "path";
import { generateId } from "src/util";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  constructor(private readonly configService: ConfigService) {}

  // ---------------------------------------------------------------------------
  // Storage mode: 'local' (dev, saves to uploaded-docs/ and serves via
  // /api/file) or 's3' (production, uploads to AWS S3). Mirrors the
  // TEMPLATE_STORAGE switch used by the template module. See docs/STORAGE.md.
  // ---------------------------------------------------------------------------
  private get storageMode(): "local" | "s3" {
    return this.configService.get("file.storage") === "s3" ? "s3" : "local";
  }

  getS3() {
    const awsConfig = this.configService.get("aws");
    if (
      awsConfig.enabled &&
      awsConfig.accessKeyId &&
      awsConfig.secretAccessKey
    ) {
      const s3 = new S3({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region,
      });
      return s3;
    }

    return null;
  }

  // ---- Local storage helpers ------------------------------------------------

  /** Root of the local uploads directory = uploaded-docs/ (served at /api/file). */
  private get localRoot(): string {
    return path.join(process.cwd(), "uploaded-docs");
  }

  private get serverBaseUrl(): string {
    return this.configService.get("server.domain") || "http://localhost:4000";
  }

  private saveLocal(file: any, folder: string): string {
    const ext = mime.extension(file.mimetype) || "bin";
    const id = generateId("doc", 10);
    const relativePath = `${folder}/${id}.${ext}`;
    const dir = path.join(this.localRoot, folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(this.localRoot, relativePath), file.buffer);
    this.logger.debug(`File saved locally: ${relativePath}`);
    // Served by the static handler mounted at /api/file (see main.ts).
    return `${this.serverBaseUrl}/api/file/${relativePath}`;
  }

  async uploadFile(file: any, folder: string) {
    try {
      if (this.storageMode === "s3") {
        const s3 = this.getS3();
        if (!s3) {
          throw new HttpException(
            "File storage (S3) is not configured. Set AWS_ENABLED=true with AWS credentials, or switch FILE_STORAGE=local",
            503
          );
        }
        this.logger.debug("Uploading file to S3");
        const id = generateId("doc", 10);
        const params = {
          Bucket: this.configService.get("aws.s3.bucket"),
          Key: `${folder}/${id}.${mime.extension(file.mimetype)}`,
          Body: file.buffer,
        };
        const result = await s3.upload(params).promise();
        this.logger.debug("File uploaded to S3");
        return result.Location;
      }

      // Local disk mode (default).
      return this.saveLocal(file, folder);
    } catch (error) {
      this.logger.error("Error uploading file", error);
      throw new HttpException(
        error.message || "Error uploading file",
        error.status || 500
      );
    }
  }

  async generateSignedUrl(mimeType: string) {
    try {
      if (this.storageMode === "s3") {
        const s3 = this.getS3();
        if (!s3) {
          throw new HttpException(
            "File storage (S3) is not configured. Set AWS_ENABLED=true with AWS credentials, or switch FILE_STORAGE=local",
            503
          );
        }
        this.logger.debug("Generating signed url for S3");
        const id = generateId("doc", 10);
        const params = {
          Bucket: this.configService.get("aws.s3.bucket"),
          Key: `docs/${id}.${mime.extension(mimeType)}`,
          Expires: 60 * 5,
          ContentType: mimeType,
        };
        const result = await s3.getSignedUrlPromise("putObject", params);
        this.logger.debug("Signed url generated for S3");
        return result;
      }

      // Local mode has no pre-signed upload URL concept: clients should POST the
      // file to /api/file (uploadFile) instead. Returning null keeps the old
      // contract (callers already handle a null response).
      this.logger.debug(
        "generateSignedUrl called in local storage mode; returning null (use POST /api/file)"
      );
      return null;
    } catch (error) {
      this.logger.error("Error generating signed url", error);
      throw new HttpException(
        error.message || "Error generating signed url",
        error.status || 500
      );
    }
  }
}
