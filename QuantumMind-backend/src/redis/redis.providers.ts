import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

import {
  REDIS_PUBLISHER_CLIENT,
  REDIS_SUBSCRIBER_CLIENT,
} from './redis.constants';

export type RedisClient = Redis;

import { ConfigService } from '@nestjs/config';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_PUBLISHER_CLIENT,
    useFactory: (configService: ConfigService) => {
      const redisConfig = configService.get('redis');
      return new Redis(redisConfig);
    },
    inject: [ConfigService],
  },
  {
    provide: REDIS_SUBSCRIBER_CLIENT,
    useFactory: (configService: ConfigService) => {
      const redisConfig = configService.get('redis');
      return new Redis(redisConfig);
    },
    inject: [ConfigService],
  },
];
