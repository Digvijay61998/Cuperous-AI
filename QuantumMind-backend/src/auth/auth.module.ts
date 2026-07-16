import { Module } from '@nestjs/common';

import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { AgentModule } from 'src/agent/agent.module';

@Module({
  providers: [JwtStrategy, AuthService],
  controllers: [AuthController],
  imports: [AgentModule],
})
export class AuthModule {}
