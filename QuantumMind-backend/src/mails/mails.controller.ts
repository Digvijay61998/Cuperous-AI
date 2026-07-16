import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { SendTranscriptDto } from './dto/send-transcript.dto';
import { MailsService } from './mails.service';

@Controller('mail')
@ApiTags('Mail')
export class MailsController {
  constructor(private readonly mailsService: MailsService) {}

  @Post()
  async sendEmail(@Body() Body: SendTranscriptDto) {
    return this.mailsService.sendMail(Body);
  }
}
