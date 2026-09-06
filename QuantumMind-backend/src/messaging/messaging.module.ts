import { HttpModule } from '@nestjs/axios';
import { Module, OnModuleInit } from '@nestjs/common';
import { FeatureFlagsModule } from 'src/feature-flags/feature-flags.module';
import { WhatsappWebEngineModule } from 'src/whatsapp-web/engine/whatsapp-web-engine.module';
import { MessagingController } from './messaging.controller';
import { MessagingProviderRegistry } from './messaging-provider.registry';
import { FacebookProvider } from './providers/facebook.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { WhatsappOfficialProvider } from './providers/whatsapp-official.provider';
import { WhatsappOpenWaProvider } from './providers/whatsapp-openwa.provider';
import { WidgetNativeProvider } from './providers/widget-native.provider';

@Module({
  imports: [HttpModule, FeatureFlagsModule, WhatsappWebEngineModule],
  controllers: [MessagingController],
  providers: [
    MessagingProviderRegistry,
    WhatsappOfficialProvider,
    WhatsappOpenWaProvider,
    TelegramProvider,
    FacebookProvider,
    WidgetNativeProvider,
  ],
  exports: [MessagingProviderRegistry],
})
export class MessagingModule implements OnModuleInit {
  constructor(
    private readonly registry: MessagingProviderRegistry,
    private readonly whatsappOfficial: WhatsappOfficialProvider,
    private readonly whatsappOpenWa: WhatsappOpenWaProvider,
    private readonly telegram: TelegramProvider,
    private readonly facebook: FacebookProvider,
    private readonly widget: WidgetNativeProvider,
  ) {}

  onModuleInit() {
    // Self-register every provider. OpenWA is registered so it can be toggled
    // in dev, but it guards itself against production sends.
    this.registry.register(this.whatsappOfficial);
    this.registry.register(this.whatsappOpenWa);
    this.registry.register(this.telegram);
    this.registry.register(this.facebook);
    this.registry.register(this.widget);
  }
}
