import { Connection } from 'mongoose';
import {
  BotSchema,
  BotSettingSchema,
  BotStylesSchema,
  Bot,
  BotSetting,
  BotStyles,
  BotFlow,
  BotFlowSchema,
  BotFlowNode,
  BotFlowNodeSchema,
} from './entities';
import { DATABASE_PROVIDER } from 'src/constants';
import {
  BOTS_PROVIDER,
  BOTS_STYLE_PROVIDER,
  BOTS_SETTING_PROVIDER,
  BOTS_FLOW_PROVIDER,
  BOTS_NODE_PROVIDER,
} from './constant';

export const botsProviders = [
  {
    provide: BOTS_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Bot.name, BotSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: BOTS_STYLE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(BotStyles.name, BotStylesSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: BOTS_SETTING_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(BotSetting.name, BotSettingSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: BOTS_FLOW_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(BotFlow.name, BotFlowSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: BOTS_NODE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(BotFlowNode.name, BotFlowNodeSchema),
    inject: [DATABASE_PROVIDER],
  },
];
