import { Global, Module } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { SegmentsController } from './segments.controller';
import { SegmentProvider } from './segments.provider';

@Global()
@Module({
  controllers: [SegmentsController],
  providers: [SegmentsService, ...SegmentProvider],
  exports: [SegmentsService],
})
export class SegmentsModule {}
