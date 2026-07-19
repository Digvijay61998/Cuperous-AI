import { ChannelEnum } from '../enums/channel.enum';

/** Outbound message the workflow engine wants delivered, channel-agnostic. */
export interface OutboundMessage {
  type:
    | 'text'
    | 'image'
    | 'video'
    | 'document'
    | 'audio'
    | 'buttons'
    | 'cta_url'
    | 'location';
  text?: string;
  mediaUrl?: string;
  caption?: string;
  buttons?: { title: string; payload: string }[];
  cta?: { displayText: string; url: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

/** Normalised inbound message parsed from any provider's native webhook. */
export interface InboundMessage {
  externalUserId: string; // provider-native id (phone / psid / chat_id)
  displayName?: string;
  type: 'text' | 'image' | 'document' | 'button_reply' | 'postback';
  text?: string;
  mediaUrl?: string;
  payload?: string; // button / postback value
  raw: unknown; // untouched provider payload (debugging only)
}

/**
 * Opaque per-conversation context carried in SocketStateService.ctx. Each
 * provider knows how to interpret its own shape (e.g. WhatsApp official carries
 * a WhatsappCloud instance + recipient; OpenWA carries a sessionId; Telegram a
 * Telegraf ctx). Kept as `any` deliberately so the interface doesn't leak
 * provider internals.
 */
export type ProviderContext = any;

export interface SendResult {
  status: 'success' | 'failed';
  providerMessageId?: string;
  error?: string;
}

export type ProviderFeature = 'text' | 'media' | 'buttons' | 'cta_url' | 'flows';

/**
 * The single abstraction every channel implements. The workflow engine depends
 * only on this interface, never on WhatsApp/Telegram/Facebook/OpenWA directly.
 */
export interface MessagingProvider {
  /** Logical channel this provider serves. */
  readonly channel: ChannelEnum;
  /** Unique provider id (e.g. 'whatsapp_official' vs 'whatsapp_openwa'). */
  readonly providerId: string;
  /** Human label for the admin toggle UI. */
  readonly displayName: string;
  /** Whether this provider is safe to run in production. OpenWA => false. */
  readonly productionSafe: boolean;

  sendMessage(
    recipient: string,
    message: OutboundMessage,
    ctx: ProviderContext,
  ): Promise<SendResult>;

  supportsFeature(feature: ProviderFeature): boolean;
}
