import { Module } from '@nestjs/common';
import { TemplateSessionService } from './template-session.service';
import { TemplateSessionController } from './template-session.controller';
import { TemplateSessionProviders } from './template-session.provider';
import { TemplateLaunchService } from './template-launch.service';

@Module({
  controllers: [TemplateSessionController],
  providers: [
    TemplateSessionService,
    TemplateLaunchService,
    ...TemplateSessionProviders,
  ],
  exports: [TemplateSessionService],
})
export class TemplateSessionModule {}
