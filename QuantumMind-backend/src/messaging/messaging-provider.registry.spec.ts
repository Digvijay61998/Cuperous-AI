import { MessagingProviderRegistry } from './messaging-provider.registry';
import { ProviderIdEnum, ChannelEnum } from './enums/channel.enum';

const makeProvider = (providerId: string, channel: string): any => ({
  providerId,
  channel,
  displayName: providerId,
  productionSafe: false,
  supportsFeature: () => false,
  sendMessage: jest.fn(),
});

describe('MessagingProviderRegistry', () => {
  const buildRegistry = (activeProvider: string | undefined) => {
    const featureFlags = {
      getActiveProvider: jest.fn().mockResolvedValue(activeProvider),
    };

    return new MessagingProviderRegistry(featureFlags as any);
  };

  it('resolves the whatsapp_web platform to the baileys provider', async () => {
    const registry = buildRegistry(undefined);
    const openWa = makeProvider(ProviderIdEnum.WHATSAPP_OPENWA, ChannelEnum.WHATSAPP);
    registry.register(makeProvider(ProviderIdEnum.WHATSAPP_OFFICIAL, ChannelEnum.WHATSAPP));
    registry.register(openWa);

    await expect(registry.resolve('whatsapp_web', 'bot1')).resolves.toBe(openWa);
  });

  it('ignores the channel feature flag for whatsapp_web', async () => {
    const registry = buildRegistry(ProviderIdEnum.WHATSAPP_OFFICIAL);
    const openWa = makeProvider(ProviderIdEnum.WHATSAPP_OPENWA, ChannelEnum.WHATSAPP);
    registry.register(makeProvider(ProviderIdEnum.WHATSAPP_OFFICIAL, ChannelEnum.WHATSAPP));
    registry.register(openWa);

    await expect(registry.resolve('whatsapp_web', 'bot1')).resolves.toBe(openWa);
  });

  it('still honours the feature flag for the whatsapp channel', async () => {
    const registry = buildRegistry(ProviderIdEnum.WHATSAPP_OPENWA);
    const official = makeProvider(ProviderIdEnum.WHATSAPP_OFFICIAL, ChannelEnum.WHATSAPP);
    const openWa = makeProvider(ProviderIdEnum.WHATSAPP_OPENWA, ChannelEnum.WHATSAPP);
    registry.register(official);
    registry.register(openWa);

    await expect(registry.resolve(ChannelEnum.WHATSAPP, 'bot1')).resolves.toBe(openWa);
  });
});
