import { Injectable, Logger, HttpException } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { S3 } from "aws-sdk";
import * as mime from "mime-types";
import { generateId } from "src/util";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  constructor(private readonly configService: ConfigService) {}

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

  async uploadFile(file: any, folder: string) {
    try {
      const s3 = this.getS3();
      const id = generateId("doc", 10);
      if (s3) {
        this.logger.debug("Uploading file to S3");
        const params = {
          Bucket: this.configService.get("aws.s3.bucket"),
          Key: `${folder}/${id}.${mime.extension(file.mimetype)}`,
          Body: file.buffer,
          ACL: "public-read",
        };
        const result = await s3.upload(params).promise();
        this.logger.debug("File uploaded to S3");
        return result.Location;
      }
    } catch (error) {
      this.logger.error("Error uploading file to S3", error);
      throw new HttpException(
        "Error uploading file to S3",
        error.status || 500
      );
    }
  }

  async generateSignedUrl(mimeType: string) {
    try {
      const s3 = this.getS3();
      const id = generateId("doc", 10);
      if (s3) {
        this.logger.debug("Generating signed url for S3");
        const params = {
          Bucket: this.configService.get("aws.s3.bucket"),
          Key: `docs/${id}.${mime.extension(mimeType)}`,
          Expires: 60 * 5,
          ContentType: mimeType,
          ACL: "public-read",
        };
        const result = await s3.getSignedUrlPromise("putObject", params);
        this.logger.debug("Signed url generated for S3");
        return result;
      }
      return null;
    } catch (error) {
      this.logger.error("Error generating signed url for S3", error);
      throw new HttpException(
        "Error generating signed url for S3",
        error.status || 500
      );
    }
  }
}
