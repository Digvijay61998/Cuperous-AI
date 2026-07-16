import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/auth/Public/public.decorator';
import { CurrentUser } from 'src/util';
import { ClickDto } from './dto/click.dto';
import { CreateVisitor } from './dto/create-visitor.dto';
import { WidgetVisitorDTO } from './dto/widget-visitor.dto';
import { WidgetService } from './widget.service';

@Controller('widget')
@ApiTags('Widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post()
  @Public()
  async getWidget(
    @Req() req: Request,
    @Query('botId') botId: string,
    @Body() body: WidgetVisitorDTO,
  ) {
    return await this.widgetService.getWidget(req, botId, body);
  }

  @ApiSecurity('bearer')
  @Post('click')
  async handleOfferClick(
    @Body() body: ClickDto,
    @Req() req: Request,
    @CurrentUser() jwt: any,
  ) {
    return await this.widgetService.handleOfferOrAdvertisementClick(
      body,
      jwt,
      req,
    );
  }

  @ApiSecurity('bearer')
  @Post('visitor')
  async createVisitor(
    @Body() body: CreateVisitor,
    @CurrentUser() jwt: any,
    @Req() req: Request,
  ) {
    return await this.widgetService.createVisitor(body, req, jwt);
  }

  @Get('traslate')
  @Public()
  async getTraslate(@Query('text') text: string, @Query('lang') lang: string) {
    return await this.widgetService.googleTranslite(text, lang);
  }
}
