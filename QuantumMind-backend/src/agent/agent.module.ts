import { Global, Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentProviders } from './agent.provider';

@Global()
@Module({
  controllers: [AgentController],
  providers: [AgentService, ...AgentProviders],
  exports: [AgentService],
})
export class AgentModule {}
