import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { AI_USAGE_PROVIDER, KNOWLEDGE_PROVIDER } from "./constants";
import {
  KnowledgeEntry,
  KnowledgeEntrySchema,
} from "./entities/knowledge-entry.entity";
import { AiUsage, AiUsageSchema } from "./entities/ai-usage.entity";

export const AiProviders = [
  {
    provide: KNOWLEDGE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(KnowledgeEntry.name, KnowledgeEntrySchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: AI_USAGE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(AiUsage.name, AiUsageSchema),
    inject: [DATABASE_PROVIDER],
  },
];
