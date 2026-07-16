import { Global, Module } from '@nestjs/common';
import { ChatInitializerService } from './chat-initializer.service';
import { ChatInitializerController } from './chat-initializer.controller';

@Global()
@Module({
  providers: [ChatInitializerService],
  exports: [ChatInitializerService],
  controllers: [ChatInitializerController],
})
export class ChatInitializerModule {}
