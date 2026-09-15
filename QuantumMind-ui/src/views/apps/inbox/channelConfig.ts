// Per-channel capability map.
//
// This is how one generic inbox renders each platform differently WITHOUT a
// component per platform. Adding Instagram or Telegram means adding a row here
// (or nothing at all — see DEFAULT_CAPABILITIES), never a new view.
//
// The alternative, branching on `channel` inside the components, is what turns a
// shared inbox into three forked screens that drift apart.

export interface ChannelCapabilities {
  /** Human label for the tab. Falls back to a humanised channel key. */
  label?: string;
  /**
   * Show the delivery-tick ladder (sent / delivered / read) on outbound bubbles.
   * Only true where the channel actually reports receipts — rendering a
   * permanently-single tick where none exist reads as "never delivered".
   */
  deliveryTicks: boolean;
  /** The channel can carry attachments. */
  media: boolean;
  /** Quoted / replied-to messages are meaningful on this channel. */
  quotedReply: boolean;
  /** An agent can pause the bot and take the thread over. */
  botToggle: boolean;
  /** Older history can be pulled on demand from the channel. */
  history: boolean;
}

/**
 * Applied to any channel with no explicit entry.
 *
 * Deliberately permissive on the safe features and conservative on the ones that
 * mislead when unsupported: a brand-new integration shows media and lets an agent
 * take over, but does not claim delivery receipts or a history API it may not
 * have. A channel appearing in the tabs before anyone adds it here is the
 * expected path, not an error.
 */
export const DEFAULT_CAPABILITIES: ChannelCapabilities = {
  deliveryTicks: false,
  media: true,
  quotedReply: false,
  botToggle: true,
  history: false,
};

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapabilities> = {
  whatsapp_web: {
    label: 'WhatsApp',
    deliveryTicks: true,
    media: true,
    quotedReply: true,
    botToggle: true,
    history: true,
  },
  whatsapp: {
    label: 'WhatsApp Business',
    deliveryTicks: true,
    media: true,
    quotedReply: true,
    botToggle: true,
    // The Cloud API has no chat-history endpoint — only what arrives by webhook.
    history: false,
  },
  telegram: {
    label: 'Telegram',
    deliveryTicks: false,
    media: true,
    quotedReply: true,
    botToggle: true,
    history: false,
  },
  instagram: {
    label: 'Instagram',
    deliveryTicks: false,
    media: true,
    quotedReply: true,
    botToggle: true,
    history: false,
  },
  facebook: {
    label: 'Facebook',
    deliveryTicks: false,
    media: true,
    quotedReply: true,
    botToggle: true,
    history: false,
  },
};

export const capabilitiesFor = (channel: string): ChannelCapabilities =>
  CHANNEL_CAPABILITIES[channel] || DEFAULT_CAPABILITIES;

/** `whatsapp_web` → `Whatsapp Web`. Used when a channel has no configured label. */
export const humanizeChannel = (channel: string): string =>
  channel
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const channelLabel = (channel: string): string =>
  CHANNEL_CAPABILITIES[channel]?.label || humanizeChannel(channel);
