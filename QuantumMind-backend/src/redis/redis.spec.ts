import { redisProviders } from './redis.providers';

describe('redisProviders', () => {
  it('declares the redis client providers', () => {
    expect(Array.isArray(redisProviders)).toBe(true);
    expect(redisProviders.length).toBeGreaterThan(0);
  });
});
