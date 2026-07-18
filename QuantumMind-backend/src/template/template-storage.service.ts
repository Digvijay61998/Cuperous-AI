import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import { makeEntriesPortable, ValidatedEntry } from './template.validator';

export interface DeployResult {
  s3Path: string;
  hostedUrl: string;
  fileCount: number;
  fileSize: number;
}

@Injectable()
export class TemplateStorageService {
  private readonly logger = new Logger(TemplateStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  // ---------------------------------------------------------------------------
  // Feature flag: 'local' (dev, saves to uploaded-docs/) or 's3' (production)
  // ---------------------------------------------------------------------------

  private get storageMode(): 'local' | 's3' {
    return this.configService.get('template.storage') === 's3' ? 's3' : 'local';
  }

  // ---------------------------------------------------------------------------
  // Local storage helpers (dev mode)
  // ---------------------------------------------------------------------------

  /** Root of the local templates directory = uploaded-docs/templates/ */
  private get localRoot(): string {
    return path.join(process.cwd(), 'uploaded-docs', 'templates');
  }

  /** 
   * Base URL of the running server. 
   * e.g. http://localhost:4000/api/file/templates/{templateId}/v{version}/index.html
   */
  private get serverBaseUrl(): string {
    return this.configService.get('server.domain') || 'http://localhost:4000';
  }

  private localUrl(relativePath: string): string {
    return `${this.serverBaseUrl}/api/file/templates/${relativePath}`;
  }

  /**
   * Builds the public hosted URL for a template version from the CURRENT
   * storage mode + config. Exposed so callers (TemplateService) can recompute
   * hostedUrl on every read instead of trusting a value persisted at upload
   * time - this makes records self-heal if SERVER_DOMAIN, the S3 bucket, or
   * the storage mode itself changes later.
   *   relPath = "{templateId}/v{version}"
   */
  buildHostedUrl(relPath: string): string {
    if (this.storageMode === 's3') {
      return this.objectUrl(`templates/${relPath}/index.html`);
    }
    return this.localUrl(`${relPath}/index.html`);
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private async deployLocal(
    templateId: string,
    version: string,
    entries: ValidatedEntry[],
  ): Promise<DeployResult> {
    const basePath = `${templateId}/v${version}`;
    const fullDir = path.join(this.localRoot, basePath);

    // Clean up if a previous attempt left partial files.
    if (fs.existsSync(fullDir)) {
      fs.rmSync(fullDir, { recursive: true, force: true });
    }

    let fileSize = 0;
    for (const entry of entries) {
      const filePath = path.join(fullDir, entry.entryPath);
      this.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, entry.data);
      fileSize += entry.size;
    }

    return {
      s3Path: basePath,
      hostedUrl: this.localUrl(`${basePath}/index.html`),
      fileCount: entries.length,
      fileSize,
    };
  }

  private async uploadThumbnailLocal(
    templateId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    const ext = path.extname(file.originalname) || '.png';
    const dir = path.join(this.localRoot, templateId);
    this.ensureDir(dir);
    const filePath = path.join(dir, `thumbnail${ext}`);
    fs.writeFileSync(filePath, file.buffer);
    return this.localUrl(`${templateId}/thumbnail${ext}`);
  }

  private async deletePrefixLocal(prefix: string): Promise<void> {
    const fullPath = path.join(this.localRoot, prefix);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }

  // ---------------------------------------------------------------------------
  // S3 helpers (production mode)
  // ---------------------------------------------------------------------------

  private getS3(): S3 | null {
    const awsConfig = this.configService.get('aws');
    if (
      awsConfig?.enabled &&
      awsConfig.accessKeyId &&
      awsConfig.secretAccessKey
    ) {
      return new S3({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region,
      });
    }
    return null;
  }

  private get bucket(): string {
    return this.configService.get('aws.s3.bucket');
  }

  private get region(): string {
    return this.configService.get('aws.region') || 'us-east-1';
  }

  private objectUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private async deployS3(
    templateId: string,
    version: string,
    entries: ValidatedEntry[],
  ): Promise<DeployResult> {
    const s3 = this.getS3();
    const basePath = `templates/${templateId}/v${version}`;

    if (!s3) {
      throw new HttpException(
        'File storage (S3) is not configured. Set AWS_ENABLED=true and AWS credentials, or switch TEMPLATE_STORAGE=local',
        503,
      );
    }

    let fileSize = 0;
    try {
      await Promise.all(
        entries.map((entry) => {
          const key = `${basePath}/${entry.entryPath}`;
          const contentType =
            mime.lookup(entry.entryPath) || 'application/octet-stream';
          fileSize += entry.size;

          const isIndex = entry.entryPath.toLowerCase() === 'index.html';
          const cacheControl = isIndex
            ? 'public, max-age=300'
            : 'public, max-age=31536000, immutable';

          return s3
            .upload({
              Bucket: this.bucket,
              Key: key,
              Body: entry.data,
              ContentType: contentType,
              CacheControl: cacheControl,
              ACL: 'public-read',
            })
            .promise();
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error deploying template ${templateId} v${version}: ${error.message}`,
      );
      await this.deletePrefixS3(`${basePath}/`).catch(() => undefined);
      throw new HttpException(
        'Failed to upload template files to storage',
        502,
      );
    }

    return {
      s3Path: basePath,
      hostedUrl: this.objectUrl(`${basePath}/index.html`),
      fileCount: entries.length,
      fileSize,
    };
  }

  private async uploadThumbnailS3(
    templateId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    const s3 = this.getS3();
    if (!s3) {
      throw new HttpException('File storage (S3) is not configured', 503);
    }
    const ext = path.extname(file.originalname) || '.png';
    const key = `templates/${templateId}/thumbnail${ext}`;
    const result = await s3
      .upload({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || mime.lookup(ext) || 'image/png',
        CacheControl: 'public, max-age=86400',
        ACL: 'public-read',
      })
      .promise();
    return result.Location;
  }

  private async deletePrefixS3(prefix: string): Promise<void> {
    const s3 = this.getS3();
    if (!s3) return;

    let continuationToken: string | undefined;
    do {
      const listed = await s3
        .listObjectsV2({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      if (listed.Contents && listed.Contents.length > 0) {
        await s3
          .deleteObjects({
            Bucket: this.bucket,
            Delete: {
              Objects: listed.Contents.map((o) => ({ Key: o.Key })),
            },
          })
          .promise();
      }
      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  // ---------------------------------------------------------------------------
  // Public API (delegates to local or S3 based on feature flag)
  // ---------------------------------------------------------------------------

  /**
   * Deploys validated template files to storage.
   * In LOCAL mode: writes to uploaded-docs/templates/{id}/v{version}/
   * In S3 mode:    uploads to s3://bucket/templates/{id}/v{version}/
   */
  async deployTemplate(
    templateId: string,
    version: string,
    entries: ValidatedEntry[],
  ): Promise<DeployResult> {
    this.logger.log(
      `Deploying template ${templateId} v${version} [mode=${this.storageMode}]`,
    );

    // Safety net: neutralise root-absolute asset refs / webpack publicPath so
    // builds that weren't configured with base:'./' still host correctly
    // from a sub-path. No-op for builds that already emit relative paths.
    const portable = makeEntriesPortable(entries);

    if (this.storageMode === 's3') {
      return this.deployS3(templateId, version, portable);
    }
    return this.deployLocal(templateId, version, portable);
  }

  /** Uploads a single thumbnail image. */
  async uploadThumbnail(
    templateId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    if (this.storageMode === 's3') {
      return this.uploadThumbnailS3(templateId, file);
    }
    return this.uploadThumbnailLocal(templateId, file);
  }

  /** Deletes an entire template's files (all versions + thumbnail). */
  async deleteTemplateFiles(templateId: string): Promise<void> {
    if (this.storageMode === 's3') {
      await this.deletePrefixS3(`templates/${templateId}/`);
    } else {
      await this.deletePrefixLocal(templateId);
    }
  }
}
