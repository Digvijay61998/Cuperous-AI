import { ChatTypeEnum } from 'src/conversation/enums/chat-type.enum';
import { ChatStatusEnum } from 'src/conversation/enums/chat-status.enum';

/**
 * Pure mapping helpers between Baileys' proto shapes and JarCube's neutral
 * message vocabulary. Kept free of NestJS and of the socket so the tricky parts
 * (which content types count as media, how a wrapped message unwraps, how an
 * ack integer maps to a tick) are readable and testable on plain objects.
 */

/** JID suffixes that identify a one-to-one human chat. */
const INDIVIDUAL_SUFFIXES = ['@s.whatsapp.net', '@lid', '@c.us'];

/**
 * True for a JID we treat as a direct conversation with one person.
 *
 * `@lid` matters: WhatsApp increasingly addresses chats by "linked id" instead
 * of the phone JID. The original implementation only accepted
 * `@s.whatsapp.net`, so every `@lid`-addressed customer message was silently
 * discarded — messages simply never arrived. `@c.us` is accepted too because
 * that is the dialect the whatsapp-web.js world (and our own normalisation)
 * uses, so a value that round-trips through storage still matches.
 */
export function isIndividualJid(jid: string | undefined | null): boolean {
  if (!jid) return false;
  return INDIVIDUAL_SUFFIXES.some((suffix) => jid.endsWith(suffix));
}

/** Groups, status broadcasts, newsletters and channels — out of scope for the inbox. */
export function isUnsupportedChatJid(jid: string | undefined | null): boolean {
  if (!jid) return true;
  return (
    jid.endsWith('@g.us') ||
    jid.endsWith('@broadcast') ||
    jid.endsWith('@newsletter') ||
    jid === 'status@broadcast'
  );
}

/**
 * The digits WhatsApp identifies a contact by.
 *
 * Only a phone-dialect JID yields a real phone number. A `@lid` JID's user part
 * is an internal id, NOT a dialable number, so returning it as `phone` would
 * write a fake phone onto the visitor record — hence the explicit null.
 */
export function jidToPhone(jid: string | undefined | null): string | undefined {
  if (!jid) return undefined;
  if (jid.endsWith('@lid')) return undefined;
  const user = jid.split('@')[0]?.split(':')[0];
  if (!user) return undefined;
  const digits = user.replace(/\D/g, '');
  return digits || undefined;
}

/** Strip any device/agent suffix so `1234:12@s.whatsapp.net` and `1234@s.whatsapp.net` are one chat. */
export function normalizeJid(jid: string | undefined | null): string {
  if (!jid) return '';
  const [user, domain] = jid.split('@');
  if (!domain) return jid;
  return `${user.split(':')[0]}@${domain}`;
}

/**
 * Baileys content-type token -> JarCube ChatTypeEnum.
 *
 * A voice note and an audio file both become AUDIO (we have no separate voice
 * type); stickers ride the IMAGE bubble; locations map to MAPS. Anything we do
 * not model returns undefined so the caller can decide, rather than being
 * silently mislabelled as text.
 */
export function mapContentTypeToChatType(
  contentType: string | undefined,
): string | undefined {
  switch (contentType) {
    case 'conversation':
    case 'extendedTextMessage':
    case 'buttonsResponseMessage':
    case 'templateButtonReplyMessage':
    case 'listResponseMessage':
    case 'interactiveResponseMessage':
    case 'buttonsMessage':
    case 'templateMessage':
    case 'interactiveMessage':
    case 'pollCreationMessage':
    case 'pollCreationMessageV2':
    case 'pollCreationMessageV3':
    case 'contactMessage':
    case 'contactsArrayMessage':
      return ChatTypeEnum.TEXT;
    case 'imageMessage':
    case 'stickerMessage':
      return ChatTypeEnum.IMAGE;
    case 'videoMessage':
      return ChatTypeEnum.VIDEO;
    case 'audioMessage':
      return ChatTypeEnum.AUDIO;
    case 'documentMessage':
    case 'documentWithCaptionMessage':
      return ChatTypeEnum.FILE;
    case 'locationMessage':
    case 'liveLocationMessage':
      return ChatTypeEnum.MAPS;
    default:
      return undefined;
  }
}

/** Content types that carry downloadable bytes. */
const MEDIA_CONTENT_TYPES = new Set([
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'documentMessage',
  'documentWithCaptionMessage',
  'stickerMessage',
]);

export function isMediaContentType(contentType: string | undefined): boolean {
  return !!contentType && MEDIA_CONTENT_TYPES.has(contentType);
}

/**
 * Extract the human-readable text of a message.
 *
 * Ordered widest-first: plain text, then media captions, then the WhatsApp
 * Business interactive shapes whose display text would otherwise be dropped
 * (these carry OTP/verification text businesses actually send), then poll
 * questions and tapped-button labels. Returns '' when there is genuinely no
 * text — which is normal for a media-only message and must NOT be treated as
 * "no message".
 */
export function extractText(content: any): string {
  if (!content) return '';
  return (
    content.conversation ??
    content.extendedTextMessage?.text ??
    content.imageMessage?.caption ??
    content.videoMessage?.caption ??
    content.documentMessage?.caption ??
    content.interactiveMessage?.body?.text ??
    content.buttonsMessage?.contentText ??
    content.templateMessage?.hydratedTemplate?.hydratedContentText ??
    content.templateMessage?.hydratedFourRowTemplate?.hydratedContentText ??
    content.interactiveResponseMessage?.body?.text ??
    content.buttonsResponseMessage?.selectedDisplayText ??
    content.templateButtonReplyMessage?.selectedDisplayText ??
    content.listResponseMessage?.title ??
    content.pollCreationMessage?.name ??
    content.pollCreationMessageV2?.name ??
    content.pollCreationMessageV3?.name ??
    content.eventMessage?.name ??
    ''
  );
}

/** The media sub-message, whichever kind it is. */
export function extractMediaInfo(content: any): {
  mimetype?: string;
  fileName?: string;
  sizeBytes?: number;
} | null {
  if (!content) return null;
  const sub =
    content.imageMessage ??
    content.videoMessage ??
    content.audioMessage ??
    content.documentMessage ??
    content.stickerMessage;
  if (!sub) return null;
  const rawLength = sub.fileLength;
  const sizeBytes =
    typeof rawLength === 'number'
      ? rawLength
      : typeof rawLength?.toNumber === 'function'
      ? rawLength.toNumber()
      : undefined;
  return {
    mimetype: sub.mimetype ?? undefined,
    fileName: content.documentMessage?.fileName ?? undefined,
    sizeBytes,
  };
}

/** Location coordinates, when the message is a (live) location. */
export function extractLocation(
  content: any,
): { latitude: number; longitude: number; name?: string } | null {
  const lm = content?.locationMessage ?? content?.liveLocationMessage;
  if (!lm) return null;
  return {
    latitude: lm.degreesLatitude ?? 0,
    longitude: lm.degreesLongitude ?? 0,
    name: content?.locationMessage?.name ?? undefined,
  };
}

/** The id of the quoted message, when this one is a reply. */
export function extractQuotedMessageId(content: any): string | undefined {
  const sub =
    content?.extendedTextMessage ??
    content?.imageMessage ??
    content?.videoMessage ??
    content?.audioMessage ??
    content?.documentMessage ??
    content?.stickerMessage;
  return sub?.contextInfo?.stanzaId ?? undefined;
}

/**
 * Baileys `messageTimestamp` (epoch SECONDS, sometimes a Long) -> JS Date.
 *
 * Guards against the zero/absent case, which would otherwise date a message to
 * 1970 and sort it to the very top of the thread forever.
 */
export function toDate(timestamp: any): Date {
  const seconds =
    typeof timestamp === 'number'
      ? timestamp
      : typeof timestamp?.toNumber === 'function'
      ? timestamp.toNumber()
      : Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return new Date();
  return new Date(seconds * 1000);
}

/** Same as {@link toDate} but yields epoch seconds, which Baileys APIs want back. */
export function toUnixSeconds(timestamp: any): number {
  const seconds =
    typeof timestamp === 'number'
      ? timestamp
      : typeof timestamp?.toNumber === 'function'
      ? timestamp.toNumber()
      : Number(timestamp);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.floor(seconds)
    : Math.floor(Date.now() / 1000);
}

/**
 * Baileys `proto.WebMessageInfo.Status` integer -> our delivery status.
 *
 *   0 ERROR | 1 PENDING | 2 SERVER_ACK | 3 DELIVERY_ACK | 4 READ | 5 PLAYED
 *
 * PLAYED collapses into `read` (a played voice note has certainly been seen).
 * An unrecognised value returns null so the caller emits NO ack rather than
 * guessing: something ambiguous upstream must stay ambiguous downstream, and a
 * fabricated tick is worse than a missing one.
 */
export function mapAckStatus(status: any): string | null {
  switch (status) {
    case 0:
      return ChatStatusEnum.FAILED;
    case 1:
      return ChatStatusEnum.PENDING;
    case 2:
      return ChatStatusEnum.SENT;
    case 3:
      return ChatStatusEnum.DELIVERED;
    case 4:
    case 5:
      return ChatStatusEnum.READ;
    default:
      return null;
  }
}
