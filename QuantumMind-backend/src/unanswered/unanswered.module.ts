import { Global, Module } from '@nestjs/common';
import { UnansweredService } from './unanswered.service';
import { UnansweredController } from './unanswered.controller';
import { UnansweredProvider } from './unanswered.provider';

@Global()
@Module({
  controllers: [UnansweredController],
  providers: [UnansweredService, ...UnansweredProvider],
  exports: [UnansweredService],
})
export class UnansweredModule {}
