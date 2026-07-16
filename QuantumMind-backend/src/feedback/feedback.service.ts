import { Injectable, Inject, Logger } from '@nestjs/common';
import { FeedbackDocument } from './entities/feedback.entity';
import { FEEDBACK_PROVIDER } from './constants';
import { Model } from 'mongoose';
import { AgentService } from 'src/agent/agent.service';

import { VisitorService } from 'src/visitor/visitor.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { FeedbackForEnum } from './enums/feedback-for.enum';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

// todo : feedback will be only for agent and bot
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  constructor(
    @Inject(FEEDBACK_PROVIDER)
    private readonly feedbackModel: Model<FeedbackDocument>,

    private readonly agentService: AgentService,
    private readonly visitorService: VisitorService,
    private readonly conversationService: ConversationService,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    try {
      const createdFeedback = new this.feedbackModel(createFeedbackDto);

      const savedFeedback = await createdFeedback.save();
      if (createFeedbackDto.feedbackFor === FeedbackForEnum.AGENT)
        await this.agentService.updateRatingAndFeedback(
          createFeedbackDto.agent,
          createFeedbackDto.rating,
          savedFeedback._id,
        );

      await this.visitorService.updateFeedback(
        createFeedbackDto.visitor,
        savedFeedback._id,
      );

      await this.conversationService.updateConversationFeedback(
        createFeedbackDto.conversation,
        savedFeedback._id,
      );
      return savedFeedback;
    } catch (error) {
      this.logger.error(`Error while creating feedback ${error}`);
    }
  }
}
