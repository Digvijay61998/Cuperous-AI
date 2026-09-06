import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
// NOTE: `@whiskeysockets/baileys` (v6.7+) is a pure ESM package. This NestJS
// backend is compiled to CommonJS, so a normal `import ... from` gets emitted
// as `require()` and crashes at runtime with ERR_REQUIRE_ESM. We therefore load
// baileys lazily via a real dynamic `import()`. The `new Function(...)` wrapper
// stops TypeScript (module: "commonjs") from down-levelling the `import()` back
// into a `require()`, so it stays a genuine ESM dynamic import at runtime.
// Types are pulled in separately with `import type`, which is erased at compile
// time and therefore safe.
import type {
  DisconnectReason as DisconnectReasonType,
} from '@whiskeysockets/baileys';

const dynamicImport = new Function(
  'specifier',
  'return import(specifier);',
) as (specifier: string) => Promise<any>;

type BaileysModule = {
  default: (...args: any[]) => any;
  makeWASocket?: (...args: any[]) => any;
  DisconnectReason: typeof DisconnectReasonType;
  fetchLatestBaileysVersion: () => Promise<{ version: any }>;
  useMultiFileAuthState: (
    folder: string,
  ) => Promise<{ state: any; saveCreds: () => Promise<void> }>;
  normalizeMessageContent?: (content: any) => any;
  getContentType?: (content: any) => string | undefined;
};

let baileysModulePromise: Promise<BaileysModule> | null = null;

/** Load the ESM baileys module once and cache the promise. */
function loadBaileys(): Promise<BaileysModule> {
  if (!baileysModulePromise) {
    baileysModulePromise = dynamicImport('@whiskeysockets/baileys').then(
      (mod) => (mod?.default && mod.default.makeWASocket ? mod.default : mod),
    );
  }
  return baileysModulePromise;
}

import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { ChatTypeEnum } from 'src/conversation/enums/chat-type.enum';
import {
  WA_WEB_ACK_EVENT,
  WA_WEB_HISTORY_EVENT,
  WA_WEB_INBOUND_EVENT,
  WA_WEB_STATUS_EVENT,
} from '../constants';
import { WhatsappWebSessionStatus } from '../enums/session-status.enum';
import {
  extractLocation,
  extractMediaInfo,
  extractQuotedMessageId,
  extractText,
  isIndividualJid,
  isMediaContentType,
  isUnsupportedChatJid,
  jidToPhone,
  mapAckStatus,
  mapContentTypeToChatType,
  normalizeJid,
  toDate,
  toUnixSeconds,
} from './baileys-message.mapper';

/**
 * A minimal pino-compatible logger so we don't need to add the `pino` dependency
 * just to silence baileys. baileys calls `.child()` and the level methods.
 */
const silentLogger: any = {
  level: 'silent',
  trace: () => undefined,
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  fatal: () => undefined,
  child: () => silentLogger,
};

/** The neutral shape the feature layer consumes for one WhatsApp message. */
export interface WaWebInboundMessage {
  name: string;
  /** Normalised chat JID (device suffix stripped). */
  jid: string;
  /** Dialable digits, or undefined for an `@lid`-only contact. */
  phone?: string;
  /** True when WE sent it (from the dashboard, the bot, or the operator's phone). */
  fromMe: boolean;
  messageId: string;
  text: string;
  type: string;
  time: Date;
  pushName?: string;
  mimetype?: string;
  fileName?: string;
  /** True when the message had media whose bytes we did not store. */
  mediaOmitted: boolean;
  quotedMessageId?: string;
  location?: { latitude: number; longitude: number; name?: string };
  /** True for a history-backfill row: persist it, never feed it to the bot. */
  historical: boolean;
}

interface SessionRuntime {
  sock: any | null;
  qr: string | null;
  status: string;
  phone?: string;
  pushName?: string;
  /** True while a deliberate stop/logout is in progress — suppresses auto-reconnect. */
  stopping: boolean;
  reconnectTimer?: NodeJS.Timeout;
  reconnectAttempts: number;
  /**
   * Epoch seconds when this connection last opened, minus a clock-skew buffer.
   * Used to tell a genuinely new message from history-sync backfill.
   */
  connectedAt: number;
}

/**
 * The in-process WhatsApp Web engine, informed by OpenWA's baileys adapter but
 * reduced to the single-node essentials JarCube needs: connect, QR, phone
 * pairing, auto-reconnect, unlink, send, delivery receipts and on-demand history.
 * It owns the live baileys sockets (keyed by session name) and persists each
 * session's auth to disk so a linked number survives a restart.
 *
 * It is a LEAF service: it depends only on ConfigService + EventEmitter2 and
 * never imports the feature/message-handler layers. It communicates outward
 * purely through events (status / inbound / ack / history), which is what keeps
 * the module graph free of circular dependencies.
 */
@Injectable()
export class BaileysEngineService implements OnModuleDestroy {
  private readonly logger = new Logger(BaileysEngineService.name);
  private readonly sessions = new Map<string, SessionRuntime>();
  private readonly baseDir: string;

  private static readonly MAX_RECONNECT_ATTEMPTS = 10;
  private static readonly RECONNECT_BASE_DELAY_MS = 3000;

  /**
   * How far before `connectedAt` a message may be stamped and still count as
   * live. `messageTimestamp` is WhatsApp's clock while ours is local, so without
   * slack a message sent at the moment of reconnect can look a second "older"
   * than the connection and be misfiled as history.
   */
  private static readonly CLOCK_SKEW_BUFFER_SECONDS = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.baseDir = path.resolve(
      this.configService.get<string>('whatsappWeb.dataPath') ||
        './data/whatsapp-web',
    );
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async onModuleDestroy(): Promise<void> {
    for (const [name, rt] of this.sessions.entries()) {
      rt.stopping = true;
      if (rt.reconnectTimer) clearTimeout(rt.reconnectTimer);
      try {
        rt.sock?.end?.(undefined);
      } catch {
        // best-effort teardown on shutdown
      }
      this.sessions.delete(name);
    }
  }

  private authDir(name: string): string {
    return path.join(this.baseDir, name);
  }

  getStatus(name: string): string {
    return this.sessions.get(name)?.status ?? WhatsappWebSessionStatus.DISCONNECTED;
  }

  getQr(name: string): string | null {
    return this.sessions.get(name)?.qr ?? null;
  }

  isActive(name: string): boolean {
    const rt = this.sessions.get(name);
    return !!rt && !!rt.sock;
  }

  private setStatus(
    name: string,
    status: string,
    extra: { phone?: string; pushName?: string; error?: string } = {},
  ): void {
    const rt = this.sessions.get(name);
    if (rt) {
      rt.status = status;
      if (extra.phone !== undefined) rt.phone = extra.phone;
      if (extra.pushName !== undefined) rt.pushName = extra.pushName;
    }
    this.eventEmitter.emit(WA_WEB_STATUS_EVENT, {
      name,
      status,
      phone: extra.phone,
      pushName: extra.pushName,
      error: extra.error,
    });
  }

  /**
   * Start (or restart) a session's engine. Idempotent: a session that already
   * has a live socket is left alone. Auth is loaded from / persisted to disk.
   */
  async start(name: string): Promise<void> {
    const existing = this.sessions.get(name);
    if (existing?.sock) {
      return;
    }

    const rt: SessionRuntime =
      existing ?? {
        sock: null,
        qr: null,
        status: WhatsappWebSessionStatus.INITIALIZING,
        stopping: false,
        reconnectAttempts: 0,
        connectedAt: Math.floor(Date.now() / 1000),
      };
    rt.stopping = false;
    rt.qr = null;
    this.sessions.set(name, rt);
    this.setStatus(name, WhatsappWebSessionStatus.INITIALIZING);

    const dir = this.authDir(name);
    fs.mkdirSync(dir, { recursive: true });

    const baileys = await loadBaileys();
    const makeWASocket = baileys.default ?? baileys.makeWASocket;

    const { state, saveCreds } = await baileys.useMultiFileAuthState(dir);
    const { version } = await baileys
      .fetchLatestBaileysVersion()
      .catch(() => ({ version: undefined as any }));

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: silentLogger,
      browser: ['JarCube', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      // Full history sync is a heavy, ban-risky bulk transfer. We deliberately
      // keep it off and instead pull history on demand, per chat, when an agent
      // actually opens the thread (see requestOlderHistory).
      syncFullHistory: false,
    });
    rt.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: any) => {
      void this.handleConnectionUpdate(name, update);
    });

    sock.ev.on('messages.upsert', (payload: any) => {
      this.handleMessagesUpsert(name, payload);
    });

    // Delivery / read receipts — the double-tick ladder. Without this
    // subscription an outbound message stays at `sent` forever.
    sock.ev.on('messages.update', (updates: any) => {
      this.handleMessagesUpdate(name, updates);
    });

    // History: both the small sync WhatsApp pushes on connect and the pages we
    // explicitly request via requestOlderHistory land here.
    sock.ev.on('messaging-history.set', (payload: any) => {
      this.handleHistorySet(name, payload);
    });
  }

  private async handleConnectionUpdate(name: string, update: any): Promise<void> {
    const rt = this.sessions.get(name);
    if (!rt) return;
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        rt.qr = await QRCode.toDataURL(qr);
        this.setStatus(name, WhatsappWebSessionStatus.QR_READY);
      } catch (error) {
        this.logger.error(`QR encode failed for ${name}: ${error?.message}`);
      }
      return;
    }

    if (connection === 'connecting') {
      if (rt.status !== WhatsappWebSessionStatus.QR_READY) {
        this.setStatus(name, WhatsappWebSessionStatus.INITIALIZING);
      }
      return;
    }

    if (connection === 'open') {
      rt.qr = null;
      rt.reconnectAttempts = 0;
      rt.connectedAt =
        Math.floor(Date.now() / 1000) -
        BaileysEngineService.CLOCK_SKEW_BUFFER_SECONDS;
      const rawId: string = rt.sock?.user?.id || '';
      const phone = rawId.split(':')[0].split('@')[0] || undefined;
      const pushName = rt.sock?.user?.name || rt.sock?.user?.verifiedName;
      this.logger.log(`WhatsApp Web session "${name}" connected (${phone})`);
      this.setStatus(name, WhatsappWebSessionStatus.READY, { phone, pushName });
      return;
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ??
        lastDisconnect?.error?.output?.payload?.statusCode;
      const baileys = await loadBaileys();
      const loggedOut = statusCode === baileys.DisconnectReason.loggedOut;

      rt.sock = null;

      if (rt.stopping) {
        this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED);
        return;
      }

      if (loggedOut) {
        // WhatsApp unlinked this device — creds are dead, a fresh QR is required.
        this.logger.warn(`WhatsApp Web session "${name}" logged out by WhatsApp`);
        await this.purgeAuth(name);
        this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED, { phone: '' });
        return;
      }

      // Transient drop — reconnect with a bounded backoff.
      if (rt.reconnectAttempts >= BaileysEngineService.MAX_RECONNECT_ATTEMPTS) {
        this.logger.error(`WhatsApp Web session "${name}" reconnect exhausted`);
        this.setStatus(name, WhatsappWebSessionStatus.FAILED, {
          error: 'Reconnect attempts exhausted',
        });
        return;
      }
      rt.reconnectAttempts += 1;
      const delay =
        BaileysEngineService.RECONNECT_BASE_DELAY_MS * rt.reconnectAttempts;
      this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED);
      rt.reconnectTimer = setTimeout(() => {
        this.start(name).catch((e) =>
          this.logger.error(`Reconnect failed for ${name}: ${e?.message}`),
        );
      }, delay);
    }
  }

  // ---------------------------------------------------------------------------
  // Inbound messages
  // ---------------------------------------------------------------------------

  /**
   * `messages.upsert` — the main inbound path.
   *
   * Three behaviours here are deliberate and each fixes a class of lost message:
   *
   * 1. **`fromMe` is emitted, not dropped.** Messages the operator sends from
   *    their own phone only ever appear through this event. Dropping them (the
   *    original behaviour) meant the dashboard thread showed the customer's half
   *    of the conversation and none of the replies sent from the phone.
   *
   * 2. **The live-vs-history decision is made on the message timestamp, not on
   *    the batch's `type` tag.** `type !== 'notify'` usually means history
   *    backfill, but WhatsApp also tags a genuinely new message `append` when it
   *    lands during a reconnect handshake — filtering on the tag silently
   *    dropped the first message after every reconnect.
   *
   * 3. **Per-message try/catch.** An exception escaping a `sock.ev` handler kills
   *    the event bridge for the remainder of the session, so one malformed
   *    message would silence every later one.
   */
  private handleMessagesUpsert(name: string, payload: any): void {
    const { messages, type } = payload || {};
    if (!Array.isArray(messages)) return;
    const rt = this.sessions.get(name);
    const connectedAt = rt?.connectedAt ?? 0;

    for (const msg of messages) {
      const messageTs = toUnixSeconds(msg?.messageTimestamp);
      // `notify` is always live. Anything else is history UNLESS its timestamp
      // says it was created after this connection opened.
      const historical = type !== 'notify' && messageTs < connectedAt;
      // `emitMessage` is async, so a surrounding try/catch would NOT see its
      // rejection — it has to be caught on the promise or it becomes an
      // unhandled rejection (and, on newer Node, can take the process down).
      void this.emitMessage(name, msg, historical).catch((error) =>
        this.logger.error(
          `Inbound parse error for ${name} (${msg?.key?.id}): ${error?.message}`,
        ),
      );
    }
  }

  /**
   * Map one raw Baileys message onto the neutral shape and publish it.
   *
   * Returns silently for anything that is not a renderable direct message:
   * groups/broadcasts/newsletters, protocol and reaction envelopes, and messages
   * with no content at all.
   */
  private async emitMessage(
    name: string,
    msg: any,
    historical: boolean,
  ): Promise<void> {
    if (!msg?.message || !msg.key?.remoteJid) return;

    const rawJid: string = msg.key.remoteJid;
    // Groups/status/newsletters are out of scope for the 1:1 support inbox.
    if (isUnsupportedChatJid(rawJid)) return;
    // Anything that is not a recognised direct-chat dialect (including a future
    // one) is skipped rather than guessed at.
    if (!isIndividualJid(rawJid)) return;

    const baileys = await loadBaileys();
    // A disappearing / view-once / captioned-document message nests its real
    // payload inside a wrapper, so the raw content exposes no text, no media and
    // no type. Normalising once here is what makes all three readable.
    const normalized =
      baileys.normalizeMessageContent?.(msg.message) ?? msg.message;
    const contentType = baileys.getContentType?.(normalized);

    // Protocol envelopes (revoke/edit/history notifications) and reactions are
    // not messages in their own right. Phase 1 skips them; they get their own
    // handling when edit/revoke/reaction support lands.
    if (
      !contentType ||
      contentType === 'protocolMessage' ||
      contentType === 'reactionMessage' ||
      contentType === 'senderKeyDistributionMessage'
    ) {
      return;
    }

    const text = extractText(normalized);
    const mediaInfo = isMediaContentType(contentType)
      ? extractMediaInfo(normalized)
      : null;
    const location = extractLocation(normalized);

    // A message with no text, no media and no location carries nothing we can
    // render — but a media-only message (image with no caption) DOES, and the
    // original `if (!text) continue` threw all of those away.
    if (!text && !mediaInfo && !location) return;

    const jid = normalizeJid(rawJid);
    const chatType =
      mapContentTypeToChatType(contentType) ??
      (mediaInfo ? ChatTypeEnum.FILE : ChatTypeEnum.TEXT);

    const message: WaWebInboundMessage = {
      name,
      jid,
      phone: jidToPhone(jid),
      fromMe: msg.key.fromMe === true,
      messageId: msg.key.id,
      text,
      type: chatType,
      time: toDate(msg.messageTimestamp),
      pushName: msg.pushName || undefined,
      mimetype: mediaInfo?.mimetype,
      fileName: mediaInfo?.fileName,
      // Phase 1 records that media EXISTS without downloading the bytes, so the
      // message is never lost and the UI can show an attachment placeholder.
      // Byte download + storage arrives with the media phase.
      mediaOmitted: !!mediaInfo,
      quotedMessageId: extractQuotedMessageId(normalized),
      location: location ?? undefined,
      historical,
    };

    this.eventEmitter.emit(WA_WEB_INBOUND_EVENT, message);
  }

  /**
   * `messages.update` — delivery and read receipts.
   *
   * Emits only when BOTH a recognised status and a message id are present. An
   * unknown status integer maps to null and is dropped rather than published as
   * a guessed tick.
   */
  private handleMessagesUpdate(name: string, updates: any): void {
    if (!Array.isArray(updates)) return;
    for (const update of updates) {
      try {
        const status = mapAckStatus(update?.update?.status);
        const messageId = update?.key?.id;
        if (!status || !messageId) continue;
        this.eventEmitter.emit(WA_WEB_ACK_EVENT, {
          name,
          messageId,
          status,
          jid: normalizeJid(update?.key?.remoteJid),
        });
      } catch (error) {
        this.logger.error(`Ack parse error for ${name}: ${error?.message}`);
      }
    }
  }

  /**
   * `messaging-history.set` — historical messages, from either the connect-time
   * sync or an on-demand page we requested.
   *
   * Everything here is published with `historical: true`. That flag is
   * load-bearing: the feature layer must persist these rows but must NEVER feed
   * them to the bot, or reconnecting would make the bot answer months-old
   * messages in bulk.
   */
  private handleHistorySet(name: string, payload: any): void {
    const messages = payload?.messages;
    if (!Array.isArray(messages) || messages.length === 0) return;

    // syncType 6 === ON_DEMAND, i.e. the answer to a requestOlderHistory call.
    const onDemand = payload?.syncType === 6;
    this.logger.log(
      `History batch for "${name}": ${messages.length} message(s)` +
        `${onDemand ? ' (on-demand)' : ''}`,
    );

    // Emitted SEQUENTIALLY, not with a fan-out of `void` calls.
    //
    // A history batch can carry hundreds of messages, and each one triggers a
    // full downstream pipeline (thread upsert + conversation lookup + insert).
    // Firing them all at once produced a thundering herd against the database
    // for what is a background backfill — and the batch has no deadline, so
    // there is nothing to gain from doing it in parallel.
    void (async () => {
      for (const msg of messages) {
        try {
          await this.emitMessage(name, msg, true);
        } catch (error) {
          this.logger.error(
            `History parse error for ${name}: ${error?.message}`,
          );
        }
      }
      this.eventEmitter.emit(WA_WEB_HISTORY_EVENT, {
        name,
        count: messages.length,
        onDemand,
        isLatest: payload?.isLatest === true,
        progress: payload?.progress ?? null,
      });
    })();
  }

  // ---------------------------------------------------------------------------
  // History on demand
  // ---------------------------------------------------------------------------

  /**
   * Ask WhatsApp for messages older than the one given — the "scroll up to load
   * older messages" behaviour of WhatsApp Web itself.
   *
   * This is a *request*, not a fetch: it returns as soon as WhatsApp accepts it,
   * and the messages arrive asynchronously on `messaging-history.set` with
   * `syncType: ON_DEMAND`. That is why the read path must serve whatever is
   * already stored and let the new page appear when it lands, exactly as
   * WhatsApp Web does.
   *
   * Note this is a genuine capability of baileys 6.7.x; OpenWA's own Baileys
   * adapter answers 501 for chat history, so this path has no counterpart there.
   */
  async requestOlderHistory(
    name: string,
    oldest: { id: string; fromMe: boolean; jid: string; timestamp: Date },
    count = 50,
  ): Promise<boolean> {
    const sock = this.requireSock(name);
    if (typeof sock.fetchMessageHistory !== 'function') {
      this.logger.warn(
        `fetchMessageHistory unavailable on the installed baileys for "${name}"`,
      );
      return false;
    }
    const key = {
      remoteJid: oldest.jid,
      id: oldest.id,
      fromMe: oldest.fromMe,
    };
    const timestampSeconds = Math.floor(oldest.timestamp.getTime() / 1000);
    try {
      await sock.fetchMessageHistory(count, key, timestampSeconds);
      return true;
    } catch (error) {
      this.logger.warn(
        `History request failed for "${name}": ${error?.message}`,
      );
      return false;
    }
  }

  /**
   * Send read receipts (the customer's blue ticks) for specific messages.
   *
   * WhatsApp acknowledges individual messages rather than a read-up-to
   * watermark, so the caller must name every message id it wants marked —
   * marking only the newest would leave a burst of earlier messages unread.
   */
  async markMessagesRead(
    name: string,
    jid: string,
    messages: Array<{ id: string; fromMe?: boolean; participant?: string }>,
  ): Promise<boolean> {
    if (!messages?.length) return false;
    const sock = this.requireSock(name);
    const keys = messages.map((m) => ({
      remoteJid: jid,
      id: m.id,
      fromMe: m.fromMe === true,
      ...(m.participant ? { participant: m.participant } : {}),
    }));
    try {
      await sock.readMessages(keys);
      return true;
    } catch (error) {
      this.logger.warn(`readMessages failed for "${name}": ${error?.message}`);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Deliberate stop: close the socket but keep credentials for a later restart. */
  async stop(name: string): Promise<void> {
    const rt = this.sessions.get(name);
    if (!rt) return;
    rt.stopping = true;
    if (rt.reconnectTimer) clearTimeout(rt.reconnectTimer);
    try {
      rt.sock?.end?.(undefined);
    } catch {
      // ignore
    }
    rt.sock = null;
    rt.qr = null;
    this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED);
  }

  /** Unlink this device from WhatsApp and wipe stored credentials. */
  async logout(name: string): Promise<void> {
    const rt = this.sessions.get(name);
    if (rt) {
      rt.stopping = true;
      if (rt.reconnectTimer) clearTimeout(rt.reconnectTimer);
      try {
        await rt.sock?.logout?.();
      } catch {
        // ignore — we purge creds regardless
      }
      try {
        rt.sock?.end?.(undefined);
      } catch {
        // ignore
      }
      rt.sock = null;
      rt.qr = null;
    }
    await this.purgeAuth(name);
    this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED, { phone: '' });
  }

  /** Force-kill a wedged session and drop it from the registry entirely. */
  async forceKill(name: string): Promise<void> {
    const rt = this.sessions.get(name);
    if (!rt) return;
    rt.stopping = true;
    if (rt.reconnectTimer) clearTimeout(rt.reconnectTimer);
    try {
      rt.sock?.ws?.close?.();
      rt.sock?.end?.(undefined);
    } catch {
      // ignore
    }
    this.sessions.delete(name);
    this.setStatus(name, WhatsappWebSessionStatus.DISCONNECTED);
  }

  /** Remove the on-disk auth directory for a session (used by logout/delete). */
  async purgeAuth(name: string): Promise<void> {
    try {
      await fs.promises.rm(this.authDir(name), { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(`Failed to purge auth dir for ${name}: ${error?.message}`);
    }
  }

  /** Fully remove a session: stop the engine and delete its credentials. */
  async destroy(name: string): Promise<void> {
    await this.forceKill(name);
    await this.purgeAuth(name);
    this.sessions.delete(name);
  }

  /**
   * Request an 8-char pairing code as an alternative to scanning the QR. The
   * session must be started (a socket must exist) and not yet registered.
   */
  async requestPairingCode(name: string, phoneNumber: string): Promise<string> {
    let rt = this.sessions.get(name);
    if (!rt?.sock) {
      await this.start(name);
      rt = this.sessions.get(name);
    }
    if (!rt?.sock) {
      throw new Error('Session engine is not running');
    }
    if (rt.sock.authState?.creds?.registered) {
      throw new Error('Session is already authenticated');
    }
    return rt.sock.requestPairingCode(phoneNumber);
  }

  // ---------------------------------------------------------------------------
  // Outbound
  // ---------------------------------------------------------------------------

  private requireSock(name: string): any {
    const rt = this.sessions.get(name);
    if (!rt?.sock || rt.status !== WhatsappWebSessionStatus.READY) {
      throw new Error(`WhatsApp Web session "${name}" is not connected`);
    }
    return rt.sock;
  }

  private toJid(recipient: string): string {
    if (recipient.includes('@')) return normalizeJid(recipient);
    return `${recipient.replace(/\D/g, '')}@s.whatsapp.net`;
  }

  /**
   * Send a text message.
   *
   * Returns the WhatsApp message id and timestamp so the caller can reconcile
   * its locally-stored row: without the id there is nothing for a later delivery
   * receipt to match against, and the message could never advance past `sent`.
   */
  async sendText(
    name: string,
    recipient: string,
    text: string,
  ): Promise<{ messageId?: string; timestamp: Date }> {
    const sock = this.requireSock(name);
    const sent = await sock.sendMessage(this.toJid(recipient), { text });
    return {
      messageId: sent?.key?.id,
      timestamp: toDate(sent?.messageTimestamp),
    };
  }

  async sendImage(
    name: string,
    recipient: string,
    url: string,
    caption?: string,
  ): Promise<{ messageId?: string; timestamp: Date }> {
    const sock = this.requireSock(name);
    const sent = await sock.sendMessage(this.toJid(recipient), {
      image: { url },
      caption: caption || undefined,
    });
    return {
      messageId: sent?.key?.id,
      timestamp: toDate(sent?.messageTimestamp),
    };
  }

  /** Send an arbitrary media URL, picking the right WhatsApp content kind. */
  async sendMedia(
    name: string,
    recipient: string,
    url: string,
    type: string,
    options: { caption?: string; mimetype?: string; fileName?: string } = {},
  ): Promise<{ messageId?: string; timestamp: Date }> {
    const sock = this.requireSock(name);
    const jid = this.toJid(recipient);
    let content: any;
    switch (type) {
      case ChatTypeEnum.IMAGE:
        content = { image: { url }, caption: options.caption || undefined };
        break;
      case ChatTypeEnum.VIDEO:
        content = { video: { url }, caption: options.caption || undefined };
        break;
      case ChatTypeEnum.AUDIO:
        content = {
          audio: { url },
          mimetype: options.mimetype || 'audio/mp4',
        };
        break;
      default:
        content = {
          document: { url },
          mimetype: options.mimetype || 'application/octet-stream',
          fileName: options.fileName || 'file',
          caption: options.caption || undefined,
        };
        break;
    }
    const sent = await sock.sendMessage(jid, content);
    return {
      messageId: sent?.key?.id,
      timestamp: toDate(sent?.messageTimestamp),
    };
  }
}
