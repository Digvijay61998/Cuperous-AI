import { Controller, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

@Controller('feedback')
@ApiTags('Feedback')
@ApiSecurity('bearer')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('submit-feedback')
  async submitFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }
}
