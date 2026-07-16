import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/auth/Public/public.decorator';
import { ChatInitializerService } from './chat-initializer.service';

@Controller('chat-initializer')
export class ChatInitializerController {
  constructor(
    private readonly chatInitializerService: ChatInitializerService,
  ) {}

  @Public()
  @Get('test/:botId')
  async test(@Param('botId') botId: string) {
    return this.chatInitializerService.createChat(botId);
  }
}
