import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { socialProviders } from './social.provider';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [SocialController],
  providers: [SocialService, ...socialProviders],
  imports: [HttpModule.register({ timeout: 5000 })],
  exports: [SocialService],
})
export class SocialModule {}
