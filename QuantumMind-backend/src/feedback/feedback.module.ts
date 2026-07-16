import { Global, Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { feedbackProviders } from './feedback.provider';
import { FeedbackController } from './feedback.controller';

@Global()
@Module({
  providers: [FeedbackService, ...feedbackProviders],
  exports: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}
