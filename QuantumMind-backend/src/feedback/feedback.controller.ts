import { Controller, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

/**
 * Feedback is submitted by visitors over the widget socket
 * (`submit-feedback`, which derives bot/visitor/agent from server-side socket
 * state). This HTTP route trusts client-supplied agent/visitor/conversation ids
 * and writes to all of them, so it is not exposed to tenants: SUPER_ADMIN only
 * (operational/backfill use).
 */
@Controller('feedback')
@ApiTags('Feedback')
@ApiSecurity('bearer')
@Roles(Role.SUPER_ADMIN)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('submit-feedback')
  async submitFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }
}
