// DI token for the WhatsappWebSession Mongoose model (custom-provider pattern,
// same as social/telegram etc. — bound to the shared DATABASE_PROVIDER connection).
export const WHATSAPP_WEB_SESSION_PROVIDER = 'WHATSAPP_WEB_SESSION_MODEL';

/**
 * Internal EventEmitter2 events used to decouple the leaf baileys engine from
 * the feature module (avoids a circular module dependency):
 *  - WA_WEB_STATUS   : engine -> feature, a session's status changed.
 *  - WA_WEB_INBOUND  : engine -> feature, a live message arrived (either direction).
 *  - WA_WEB_ACK      : engine -> feature, a delivery/read receipt arrived.
 *  - WA_WEB_HISTORY  : engine -> feature, a batch of historical messages arrived.
 *  - WA_WEB_SEND     : redis-propagate -> feature, a bot reply to deliver.
 */
export const WA_WEB_STATUS_EVENT = 'whatsappweb.status';
export const WA_WEB_INBOUND_EVENT = 'whatsappweb.inbound';
export const WA_WEB_ACK_EVENT = 'whatsappweb.ack';
export const WA_WEB_HISTORY_EVENT = 'whatsappweb.history';
/**
 * engine -> feature: the chat list / contact book WhatsApp pushed.
 *
 * Separate from the inbound-message event because these carry no message: they
 * are what lets the inbox list a conversation that has not written to us since
 * this process started.
 */
export const WA_WEB_CHATS_EVENT = 'whatsappweb.chats';
export const WA_WEB_SEND_EVENT = 'send-whatsapp-web-message';

/** The `channel` value ChannelThread rows use for this platform. */
export const WA_WEB_CHANNEL = 'whatsapp_web';
