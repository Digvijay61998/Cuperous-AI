import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
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

  /**
   * Meta Cloud API webhook. Answers 200 immediately (Meta retries anything
   * slow and eventually disables the subscription), then processes. A payload
   * with a bad signature is refused when WHATSAPP_APP_SECRET is configured.
   */
  @Post('webhook')
  @Public()
  async postWebhook(
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    if (!this.whatsappService.verifySignature(req.rawBody, signature)) {
      return res.status(401).send('invalid signature');
    }
    res.status(200).send('ok');
    void this.whatsappService.handleWebhook(body);
  }
}
