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

  /**
   * Send one templated email (crm-incident-handover R19.4). Templates run in
   * strict mode, so every placeholder must be in `context`; values are
   * HTML-escaped by Handlebars. Retries transient failures 3 times within
   * about 5 minutes (R6.11 carried). Throws after the last attempt so the
   * caller can record the failure.
   */
  async sendTemplate(
    to: string,
    subject: string,
    template: string,
    context: Record<string, string>,
    opts: { retryDelaysMs?: number[] } = {},
  ): Promise<void> {
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid recipient');
    }
    // Header injection guard: subjects never carry line breaks.
    const safeSubject = String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200);
    const delays = opts.retryDelaysMs ?? [10_000, 60_000, 180_000];
    let lastError: any;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await this.mailerService.sendMail({
          to,
          subject: safeSubject,
          template: `./${template}`,
          context,
          ...(process.env.ORG_MAIL_FROM ? { from: process.env.ORG_MAIL_FROM } : {}),
        });
        return;
      } catch (error) {
        lastError = error;
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }
    this.logger.error(`Mail "${template}" to ${to.replace(/(.).*@/, '$1***@')} failed: ${lastError?.message}`);
    throw lastError;
  }

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
        subject: 'Greeting from JarCube',
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
