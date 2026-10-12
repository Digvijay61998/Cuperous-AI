import { Global, Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentProviders } from './agent.provider';

@Global()
@Module({
  controllers: [AgentController],
  providers: [AgentService, ...AgentProviders],
  // AgentProviders exported so TokenService can reload the Agent on refresh
  // without depending on AgentService (avoids a provider cycle).
  exports: [AgentService, ...AgentProviders],
})
export class AgentModule {}
