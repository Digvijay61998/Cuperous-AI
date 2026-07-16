import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConversationService } from 'src/conversation/conversation.service';
import { SendTranscriptDto } from './dto/send-transcript.dto';

@Injectable()
export class MailsService {
  private readonly logger = new Logger(MailsService.name);
  constructor(
    private mailerService: MailerService,
    private readonly conversationService: ConversationService,
  ) {}

  @OnEvent('send-transcript-to-visitor', { async: true })
  async sendMail({
    email,
    name,
    conversationId,
    visitorId,
  }: SendTranscriptDto) {
    try {
      const chats = await this.conversationService.getChats(
        conversationId,
        visitorId,
      );

      return await this.mailerService.sendMail({
        to: email,
        subject: 'Greeting from Engage Bot',
        template: './mail-transcript.template.hbs',
        context: {
          name: name,
          transcript: chats,
        },
      });
    } catch (err) {
      this.logger.error('Error in sending mail', err.message);
    }
  }
}
