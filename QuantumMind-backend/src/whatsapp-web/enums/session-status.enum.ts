/**
 * WhatsApp Web session lifecycle states. Mirrors OpenWA's SessionStatus so the
 * dashboard can map them to the same display labels (ready => "Connected",
 * created => "New", initializing => "Starting", …).
 */
export const WhatsappWebSessionStatus = {
  CREATED: 'created',
  INITIALIZING: 'initializing',
  QR_READY: 'qr_ready',
  AUTHENTICATING: 'authenticating',
  READY: 'ready',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
} as const;

export type WhatsappWebSessionStatusType =
  (typeof WhatsappWebSessionStatus)[keyof typeof WhatsappWebSessionStatus];

export const WhatsappWebSessionStatusList: string[] = Object.values(
  WhatsappWebSessionStatus,
);
