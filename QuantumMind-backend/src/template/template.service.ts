import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { TEMPLATE_PROVIDER } from './constant';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SearchTemplateDto } from './dto/search-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateDocument } from './entities/template.entity';
import { TemplateCategoryEnumList } from './enums/template-category.enum';
import { TemplateIndustryEnumList } from './enums/template-industry.enum';
import {
  TemplateStatusEnum,
  TemplateStatusEnumList,
} from './enums/template-status.enum';
import { TemplateStorageService } from './template-storage.service';
import {
  extractConfigSchema,
  validateTemplateZip,
} from './template.validator';

type UploadedFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @Inject(TEMPLATE_PROVIDER)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly storageService: TemplateStorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** Generates a slug unique across non-deleted templates. */
  private async generateUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    const root = this.slugify(base) || 'template';
    let candidate = root;
    let counter = 2;
    while (true) {
      const query: any = { slug: candidate };
      if (excludeId) query._id = { $ne: excludeId };
      const exists = await this.templateModel.exists(query);
      if (!exists) return candidate;
      candidate = `${root}-${counter}`;
      counter += 1;
    }
  }

  private bumpVersion(version: string): string {
    const parts = (version || '1.0.0').split('.').map((n) => parseInt(n, 10));
    while (parts.length < 3) parts.push(0);
    parts[2] += 1; // patch bump by default
    return parts.join('.');
  }

  /**
   * Recomputes hostedUrl from the CURRENT storage mode/config rather than
   * trusting the value persisted at upload time. This self-heals records that
   * were saved under a stale SERVER_DOMAIN, a different bucket, or before a
   * local<->s3 storage mode switch.
   */
  private attachHostedUrl<T extends TemplateDocument>(template: T): T {
    if (template?.currentVersion) {
      template.hostedUrl = this.storageService.buildHostedUrl(
        `${template.id}/v${template.currentVersion}`,
      );
    }
    return template;
  }

  // ---------------------------------------------------------------------------
  // Create (metadata + ZIP)
  // ---------------------------------------------------------------------------

  async create(
    dto: CreateTemplateDto,
    files: { template?: UploadedFile; thumbnail?: UploadedFile },
    user?: JwtPayload,
  ) {
    try {
      const templateFile = files?.template;
      if (!templateFile) {
        throw new HttpException('Template ZIP file is required', 400);
      }

      // 1. Validate the ZIP up front (throws on any violation).
      const validated = validateTemplateZip(templateFile);
      const { configSchema, configValues, meta } = extractConfigSchema(
        validated.manifest,
      );

      // 2. Reserve a slug + create the document so we have an id for the S3 path.
      const slug = await this.generateUniqueSlug(dto.slug || dto.name);
      const version = '1.0.0';

      const template = await this.templateModel.create({
        name: dto.name,
        slug,
        description: dto.description || '',
        industry: dto.industry,
        category: dto.category,
        tags: dto.tags || [],
        status: dto.status || TemplateStatusEnum.DRAFT,
        currentVersion: version,
        configSchema,
        configValues,
        supportedLanguages:
          dto.supportedLanguages || meta.supportedLanguages || ['en'],
        supportsDarkMode: dto.supportsDarkMode ?? meta.supportsDarkMode ?? false,
        isResponsive: dto.isResponsive ?? true,
        estimatedDuration: dto.estimatedDuration || meta.estimatedDuration || '',
        createdBy: user?._id || null,
        updatedBy: user?._id || null,
      });

      // 3. Deploy files to S3.
      const deploy = await this.storageService.deployTemplate(
        template.id,
        version,
        validated.entries,
      );

      // 4. Optional thumbnail.
      let thumbnail = '';
      if (files?.thumbnail) {
        thumbnail = await this.storageService.uploadThumbnail(
          template.id,
          files.thumbnail,
        );
      }

      // 5. Persist hosting metadata + first version record.
      template.hostedUrl = deploy.hostedUrl;
      template.thumbnail = thumbnail;
      template.versions = [
        {
          version,
          s3Path: deploy.s3Path,
          hostedUrl: deploy.hostedUrl,
          uploadedAt: new Date(),
          uploadedBy: (user?._id as any) || null,
          fileSize: deploy.fileSize,
          fileCount: deploy.fileCount,
          changelog: dto.changelog || 'Initial version',
        },
      ] as any;
      await template.save();

      return template;
    } catch (error) {
      this.logger.error(`Error creating template: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // ---------------------------------------------------------------------------
  // List / read
  // ---------------------------------------------------------------------------

  async findAll(query: SearchTemplateDto) {
    try {
      const {
        skip = 0,
        limit = 10,
        status,
        industry,
        category,
        text,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const queryObj: any = { isDeleted: false };
      if (status) queryObj.status = status;
      if (industry) queryObj.industry = industry;
      if (category) queryObj.category = category;
      if (text) queryObj.$text = { $search: text };

      const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const cursor = this.templateModel
        .find(queryObj)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .skip(Number(skip))
        .sort(sort);
      if (limit) cursor.limit(Number(limit));

      const data = await cursor;
      data.forEach((t) => this.attachHostedUrl(t));
      const count = await this.templateModel.countDocuments(queryObj);

      return { data, count, params: this.getParams() };
    } catch (error) {
      this.logger.error(`Error listing templates: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  getParams() {
    return {
      industries: TemplateIndustryEnumList,
      categories: TemplateCategoryEnumList,
      statuses: TemplateStatusEnumList,
    };
  }

  async findOne(id: string) {
    try {
      const template = await this.templateModel
        .findOne({ _id: id, isDeleted: false })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      if (!template) throw new HttpException('Template not found', 404);
      this.attachHostedUrl(template);
      return template;
    } catch (error) {
      this.logger.error(`Error fetching template ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Public runtime config consumed by the hosted template. */
  async getConfig(id: string) {
    try {
      const template = await this.templateModel
        .findOne({ _id: id, isDeleted: false })
        .select('name slug configSchema configValues supportedLanguages supportsDarkMode status');
      if (!template) throw new HttpException('Template not found', 404);
      return {
        id: template.id,
        name: template.name,
        slug: template.slug,
        configSchema: template.configSchema,
        configValues: template.configValues,
        supportedLanguages: template.supportedLanguages,
        supportsDarkMode: template.supportsDarkMode,
      };
    } catch (error) {
      this.logger.error(`Error fetching config ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateTemplateDto, user?: JwtPayload) {
    try {
      const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!template) throw new HttpException('Template not found', 404);

      // Keep slug unique if the caller changed it explicitly.
      if (dto.slug && dto.slug !== template.slug) {
        template.slug = await this.generateUniqueSlug(dto.slug, id);
      }

      const editable: (keyof UpdateTemplateDto)[] = [
        'name',
        'description',
        'industry',
        'category',
        'tags',
        'status',
        'supportedLanguages',
        'supportsDarkMode',
        'isResponsive',
        'estimatedDuration',
      ];
      for (const key of editable) {
        if (dto[key] !== undefined) (template as any)[key] = dto[key];
      }

      template.updatedBy = (user?._id as any) || template.updatedBy;
      await template.save();
      return template;
    } catch (error) {
      this.logger.error(`Error updating template ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateConfig(
    id: string,
    configValues: Record<string, any>,
    user?: JwtPayload,
  ) {
    try {
      const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!template) throw new HttpException('Template not found', 404);

      template.configValues = { ...template.configValues, ...configValues };
      template.markModified('configValues');
      template.updatedBy = (user?._id as any) || template.updatedBy;
      await template.save();
      return template;
    } catch (error) {
      this.logger.error(`Error updating config ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Versioning
  // ---------------------------------------------------------------------------

  async uploadNewVersion(
    id: string,
    file: UploadedFile,
    changelog: string,
    user?: JwtPayload,
  ) {
    try {
      const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!template) throw new HttpException('Template not found', 404);

      const validated = validateTemplateZip(file);
      const version = this.bumpVersion(template.currentVersion);

      const deploy = await this.storageService.deployTemplate(
        template.id,
        version,
        validated.entries,
      );

      // Refresh config schema from the new manifest but preserve existing overrides.
      const { configSchema, configValues } = extractConfigSchema(
        validated.manifest,
      );
      if (configSchema.length > 0) {
        template.configSchema = configSchema as any;
        template.configValues = { ...configValues, ...template.configValues };
        template.markModified('configValues');
      }

      template.versions.push({
        version,
        s3Path: deploy.s3Path,
        hostedUrl: deploy.hostedUrl,
        uploadedAt: new Date(),
        uploadedBy: (user?._id as any) || null,
        fileSize: deploy.fileSize,
        fileCount: deploy.fileCount,
        changelog: changelog || `Version ${version}`,
      } as any);
      template.currentVersion = version;
      template.hostedUrl = deploy.hostedUrl;
      template.updatedBy = (user?._id as any) || template.updatedBy;
      await template.save();
      return template;
    } catch (error) {
      this.logger.error(`Error uploading version for ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async rollback(id: string, version: string, user?: JwtPayload) {
    try {
      const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!template) throw new HttpException('Template not found', 404);

      const target = template.versions.find((v) => v.version === version);
      if (!target) {
        throw new HttpException(`Version ${version} not found`, 404);
      }

      template.currentVersion = target.version;
      this.attachHostedUrl(template);
      template.updatedBy = (user?._id as any) || template.updatedBy;
      await template.save();
      return template;
    } catch (error) {
      this.logger.error(`Error rolling back ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  private async setStatus(id: string, status: string, user?: JwtPayload) {
    const template = await this.templateModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!template) throw new HttpException('Template not found', 404);

    if (status === TemplateStatusEnum.PUBLISHED && !template.currentVersion) {
      throw new HttpException(
        'Cannot publish a template that has no hosted build',
        400,
      );
    }

    template.status = status;
    template.updatedBy = (user?._id as any) || template.updatedBy;
    await template.save();
    return this.attachHostedUrl(template);
  }

  async publish(id: string, user?: JwtPayload) {
    return this.setStatus(id, TemplateStatusEnum.PUBLISHED, user);
  }

  async unpublish(id: string, user?: JwtPayload) {
    return this.setStatus(id, TemplateStatusEnum.DRAFT, user);
  }

  async archive(id: string, user?: JwtPayload) {
    return this.setStatus(id, TemplateStatusEnum.ARCHIVED, user);
  }

  // ---------------------------------------------------------------------------
  // Duplicate
  // ---------------------------------------------------------------------------

  async duplicate(id: string, user?: JwtPayload) {
    try {
      const source = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!source) throw new HttpException('Template not found', 404);

      const slug = await this.generateUniqueSlug(`${source.slug}-copy`);
      const copy = await this.templateModel.create({
        name: `${source.name} (Copy)`,
        slug,
        description: source.description,
        industry: source.industry,
        category: source.category,
        tags: source.tags,
        thumbnail: source.thumbnail,
        currentVersion: source.currentVersion,
        versions: source.versions,
        hostedUrl: source.hostedUrl,
        status: TemplateStatusEnum.DRAFT,
        configSchema: source.configSchema,
        configValues: source.configValues,
        supportedLanguages: source.supportedLanguages,
        supportsDarkMode: source.supportsDarkMode,
        isResponsive: source.isResponsive,
        estimatedDuration: source.estimatedDuration,
        createdBy: user?._id || null,
        updatedBy: user?._id || null,
      });
      return copy;
    } catch (error) {
      this.logger.error(`Error duplicating template ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  async softDelete(id: string, user?: JwtPayload) {
    try {
      const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!template) throw new HttpException('Template not found', 404);

      template.isDeleted = true;
      template.deletedAt = new Date();
      template.deletedBy = (user?._id as any) || null;
      template.status = TemplateStatusEnum.ARCHIVED;
      await template.save();
      return { success: true, id };
    } catch (error) {
      this.logger.error(`Error deleting template ${id}: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
