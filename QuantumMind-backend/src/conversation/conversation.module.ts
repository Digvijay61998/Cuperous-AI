import { Global, Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { conversationProvider } from './conversation.provider';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
  controllers: [ConversationController],
  providers: [ConversationService, ...conversationProvider],
  exports: [ConversationService],
  imports: [ScheduleModule.forRoot()],
})
export class ConversationModule {}
