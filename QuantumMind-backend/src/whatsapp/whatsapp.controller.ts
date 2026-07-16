import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Public } from 'src/auth/Public/public.decorator';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('webhook')
  @Public()
  async getWebhook(@Query() query: any) {
    return this.whatsappService.getWebhook(query);
  }

  @Post('webhook')
  @Public()
  async postWebhook(@Body() body: any, @Res() res: any) {
    return this.whatsappService.postWebhook(body, res);
  }
}
