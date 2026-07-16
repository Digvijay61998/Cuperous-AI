import { Connection } from 'mongoose';
import { Agent, AgentSchema } from './entities/agent.entity';
import { AGENT_PROVIDER, DATABASE_PROVIDER } from 'src/constants';

export const AgentProviders = [
  {
    provide: AGENT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Agent.name, AgentSchema),
    inject: [DATABASE_PROVIDER],
  },
];
