import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { HttpModule } from '@nestjs/axios';
import { SocialModule } from 'src/social/social.module';

@Module({
  controllers: [FacebookController],
  providers: [FacebookService],
  imports: [HttpModule, SocialModule],
})
export class FacebookModule {}
