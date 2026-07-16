import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { VideoProviders } from './video.provider';

@Module({
  controllers: [VideoController],
  providers: [VideoService, ...VideoProviders],
  exports: [VideoService],
})
export class VideoModule {}
