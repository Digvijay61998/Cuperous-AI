import { Global, Module } from '@nestjs/common';
import { RedisPropagatorService } from './redis-propagate.service';

@Global()
@Module({
  providers: [RedisPropagatorService],
  exports: [RedisPropagatorService],
})
export class RedisPropagateModule {}
