import { Global, Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { questionProviders } from './questions.provider';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, ...questionProviders],
  exports: [QuestionsService],
  imports: [HttpModule.register({ timeout: 5000, maxRedirects: 5 })],
})
export class QuestionsModule {}
