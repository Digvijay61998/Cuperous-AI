import { Module } from '@nestjs/common';
import { UploadModule } from 'src/upload/upload.module';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TemplateActionController } from './template-action.controller';
import { TemplateActionService } from './template-action.service';
import { TemplateProviders } from './template.provider';
import { TemplateStorageService } from './template-storage.service';

@Module({
  imports: [UploadModule],
  controllers: [TemplateController, TemplateActionController],
  providers: [
    TemplateService,
    TemplateStorageService,
    TemplateActionService,
    ...TemplateProviders,
  ],
  exports: [TemplateService],
})
export class TemplateModule {}
