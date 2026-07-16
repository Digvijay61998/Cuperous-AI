import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Public } from 'src/auth/Public/public.decorator';
import { FacebookService } from './facebook.service';
import { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('facebook')
@ApiExcludeController()
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Public()
  @Get('webhook')
  getWebhook(@Query() query: any) {
    return this.facebookService.getWebhook(query);
  }

  @Public()
  @Post('webhook')
  postWebhook(@Body() body: any) {
    return this.facebookService.postWebhook(body);
  }
}
