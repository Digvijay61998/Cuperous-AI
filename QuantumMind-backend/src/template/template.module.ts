import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TemplateProviders } from './template.provider';
import { TemplateStorageService } from './template-storage.service';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService, TemplateStorageService, ...TemplateProviders],
  exports: [TemplateService],
})
export class TemplateModule {}
