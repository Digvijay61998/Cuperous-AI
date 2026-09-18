import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  InboxChannelState,
  InboxChannelStatusAccount,
  InboxChannelStatusResult,
} from 'src/inbox/inbox.constants';
import { SocialService } from 'src/social/social.service';
import { SocialStatusEnum } from 'src/social/enums/social-status.enum';
import { BaileysEngineService } from './engine/baileys-engine.service';
import { WA_WEB_CHANNEL, WHATSAPP_WEB_SESSION_PROVIDER } from './constants';
import { WhatsappWebSessionDocument } from './entities/whatsapp-web-session.entity';
import { WhatsappWebSessionStatus } from './enums/session-status.enum';
import { CreateWhatsappWebSessionDto } from './dto/create-session.dto';

/**
 * Owns the WhatsApp Web session records (Mongoose) and orchestrates the baileys
 * engine + the linked Social messenger row. Mirrors OpenWA's SessionService
 * surface (create/list/get/start/stop/logout/forceKill/delete/getQr/pairing)
 * reduced to JarCube's single-node needs.
 */
@Injectable()
export class WhatsappWebService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WhatsappWebService.name);

  constructor(
    @Inject(WHATSAPP_WEB_SESSION_PROVIDER)
    private readonly sessionModel: Model<WhatsappWebSessionDocument>,
    private readonly engine: BaileysEngineService,
    private readonly socialService: SocialService,
  ) {}

  /** Re-launch previously-linked sessions so connected numbers survive a restart. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      const sessions = await this.sessionModel.find({
        phone: { $nin: [null, ''] },
        status: {
          $in: [
            WhatsappWebSessionStatus.READY,
            WhatsappWebSessionStatus.DISCONNECTED,
          ],
        },
      });
      for (const s of sessions) {
        this.engine
          .start(s.name)
          .catch((e) =>
            this.logger.error(`Auto-start failed for ${s.name}: ${e?.message}`),
          );
      }
    } catch (error) {
      this.logger.error(`WhatsApp Web auto-start scan failed: ${error?.message}`);
    }
  }

  private toView(session: WhatsappWebSessionDocument) {
    const obj: any = session.toObject ? session.toObject() : session;
    return {
      ...obj,
      // Live runtime state the DB row does not carry.
      engineLoaded: this.engine.isActive(session.name),
      liveStatus: this.engine.getStatus(session.name),
    };
  }

  async create(dto: CreateWhatsappWebSessionDto) {
    const existing = await this.sessionModel.findOne({ name: dto.name });
    if (existing) {
      throw new ConflictException(
        `A WhatsApp Web session named "${dto.name}" already exists`,
      );
    }

    const social = await this.socialService.createWhatsappWebSocial({
      name: dto.name,
      jarcubeBot: dto.jarcubeBot,
    });

    try {
      const session = await this.sessionModel.create({
        name: dto.name,
        jarcubeBot: dto.jarcubeBot,
        social: social._id,
        status: WhatsappWebSessionStatus.CREATED,
      });
      // Back-link the session onto the Social row so the list can drive the
      // session action buttons without a second lookup.
      await this.socialService.updateWhatsappWebMeta(
        (social._id as any).toString(),
        {
          sessionId: (session._id as any).toString(),
          sessionStatus: WhatsappWebSessionStatus.CREATED,
        },
      );
      return this.toView(session);
    } catch (error) {
      // Roll back the orphaned Social row if the session insert failed.
      await this.socialService.deleteById((social._id as any).toString());
      throw error;
    }
  }

  async findAll() {
    const sessions = await this.sessionModel
      .find()
      .sort({ createdAt: -1 })
      .populate('jarcubeBot', 'name');
    return sessions.map((s) => this.toView(s));
  }

  private async requireSession(id: string): Promise<WhatsappWebSessionDocument> {
    const session = await this.sessionModel.findById(id);
    if (!session) {
      throw new NotFoundException(`WhatsApp Web session "${id}" not found`);
    }
    return session;
  }

  async findOne(id: string) {
    const session = await this.requireSession(id);
    return this.toView(session);
  }

  /** Resolve the JarCube bot id for a session name (used by inbound routing). */
  async getRoutingInfo(
    name: string,
  ): Promise<{ id: string; jarcubeBotId: string } | null> {
    const session = await this.sessionModel.findOne({ name });
    if (!session || !session.jarcubeBot) return null;
    return {
      id: (session._id as any).toString(),
      jarcubeBotId: session.jarcubeBot.toString(),
    };
  }

  async start(id: string) {
    const session = await this.requireSession(id);
    await this.engine.start(session.name);
    session.status = WhatsappWebSessionStatus.INITIALIZING;
    await session.save();
    return this.toView(session);
  }

  async stop(id: string) {
    const session = await this.requireSession(id);
    await this.engine.stop(session.name);
    return this.toView(session);
  }

  async logout(id: string) {
    const session = await this.requireSession(id);
    await this.engine.logout(session.name);
    return this.toView(session);
  }

  async forceKill(id: string) {
    const session = await this.requireSession(id);
    await this.engine.forceKill(session.name);
    return this.toView(session);
  }

  async delete(id: string) {
    const session = await this.requireSession(id);
    await this.engine.destroy(session.name);
    if (session.social) {
      await this.socialService.deleteById(session.social.toString());
    }
    await this.sessionModel.findByIdAndDelete(id);
    return { success: true };
  }

  async getQr(id: string) {
    const session = await this.requireSession(id);
    const qrCode = this.engine.getQr(session.name);
    const status = this.engine.getStatus(session.name);
    if (!qrCode) {
      if (status === WhatsappWebSessionStatus.READY) {
        throw new BadRequestException(
          'Session is already authenticated, no QR code needed',
        );
      }
      throw new BadRequestException('QR code is not ready yet. Please wait...');
    }
    return { qrCode, status };
  }

  async requestPairingCode(id: string, phoneNumber: string) {
    const session = await this.requireSession(id);
    const status = this.engine.getStatus(session.name);
    if (status === WhatsappWebSessionStatus.READY) {
      throw new BadRequestException(
        'Session is already authenticated, no pairing needed',
      );
    }
    const pairingCode = await this.engine.requestPairingCode(
      session.name,
      phoneNumber,
    );
    return { pairingCode, status: this.engine.getStatus(session.name) };
  }

  /**
   * Why the WhatsApp Web channel is (or is not) usable, for the inbox banner.
   *
   * WHY THIS IS DERIVED RATHER THAN STORED
   * --------------------------------------
   * The persisted `status` column cannot answer the question on its own. Three
   * completely different operator situations all land on `disconnected`:
   *
   *   - an operator pressed Stop            -> restartable, creds intact
   *   - WhatsApp unlinked the device        -> creds purged, needs a fresh QR
   *   - the socket dropped on its own       -> the engine is already retrying
   *
   * Telling them apart needs the live engine runtime (is a retry queued?) and the
   * on-disk auth state (do we still have credentials?), neither of which is in the
   * DB. Adding `expired`/`disabled` to the status enum would not help: nothing
   * writes them, because the engine never learns "the operator considers this
   * disabled" — it only ever sees a closed socket.
   *
   * `botIds` is the caller's permission scope; an EMPTY array means "may see
   * nothing" and must yield no accounts rather than every tenant's.
   */
  async getChannelStatus(
    botIds?: string[] | null,
  ): Promise<InboxChannelStatusResult> {
    const filter: Record<string, any> = {};
    if (botIds !== undefined && botIds !== null) {
      filter.jarcubeBot = { $in: botIds };
    }

    const sessions = await this.sessionModel.find(filter).sort({ createdAt: 1 });
    const accounts = sessions.map((s) => this.deriveAccountState(s));

    // A channel with two numbers, one working, is CONNECTED: messages still flow,
    // and a banner would be a false alarm an agent learns to ignore. The banner is
    // for the case where nothing can send.
    const connected = accounts.some((a) => a.state === 'connected');

    return {
      channel: WA_WEB_CHANNEL,
      connected,
      // With nothing connected, report the most actionable state rather than the
      // first one: an operator with a stopped number and an expired one needs to be
      // told about the expired one, because pressing Start will not fix it.
      state: connected
        ? 'connected'
        : this.mostActionableState(accounts.map((a) => a.state)),
      accounts,
    };
  }

  /** One session's operator-facing state, from the row + live engine facts. */
  private deriveAccountState(
    session: WhatsappWebSessionDocument,
  ): InboxChannelStatusAccount {
    const runtime = this.engine.getRuntimeInfo(session.name);
    const base = {
      sessionName: session.name,
      label: session.name,
      phone: session.phone || undefined,
    };

    // The engine's live view wins over the stored column while the process holds
    // the session: the row is only as fresh as the last status event it persisted,
    // and a status event can be lost to a crash mid-write.
    const status = runtime.known ? runtime.status : session.status;

    switch (status) {
      case WhatsappWebSessionStatus.READY:
        // Trust the engine, not the row: a row left at `ready` by a hard kill
        // (no clean shutdown, so no `disconnected` event was ever persisted) would
        // otherwise report a healthy connection that does not exist.
        if (runtime.active) return { ...base, state: 'connected' };
        break;

      case WhatsappWebSessionStatus.QR_READY:
        return { ...base, state: 'awaiting_scan' };

      case WhatsappWebSessionStatus.INITIALIZING:
      case WhatsappWebSessionStatus.AUTHENTICATING:
        return { ...base, state: 'connecting' };

      case WhatsappWebSessionStatus.FAILED:
        return {
          ...base,
          state: 'failed',
          detail: session.lastError || undefined,
        };

      case WhatsappWebSessionStatus.CREATED:
        // Never linked to a number at all — distinct from a link that has lapsed.
        return { ...base, state: 'not_connected' };
    }

    // Everything below is the `disconnected` family, plus a `ready` row whose
    // engine is gone.
    //
    // No credentials on disk is decisive and checked FIRST: logout/unlink purges
    // them, so there is nothing left to restart and only a new scan will do. This
    // also correctly catches a session whose auth directory was wiped out of band.
    if (!runtime.hasCredentials) {
      return {
        ...base,
        // A session that never had a phone was never linked, so "expired" would be
        // a lie; it is simply not set up yet.
        state: session.phone ? 'session_expired' : 'not_connected',
      };
    }

    // A retry is queued: the engine expects to come back on its own, so the
    // operator should wait rather than touch anything.
    if (runtime.reconnectPending) return { ...base, state: 'reconnecting' };

    // Creds are intact and nothing is retrying. Either an operator stopped it, or
    // the process restarted and has not started it yet — both are fixed by the
    // same action (Start), which is what `disabled` tells the operator to do.
    return { ...base, state: 'disabled' };
  }

  /**
   * Pick the state worth putting in front of the operator.
   *
   * Ordered by how much it needs a human: something that will never recover on its
   * own outranks something that is already recovering. Without this the banner
   * would show whichever session happened to be created first, which for an
   * operator with several numbers is arbitrary.
   */
  private mostActionableState(
    states: InboxChannelState[],
  ): InboxChannelState {
    if (!states.length) return 'removed';
    const priority: InboxChannelState[] = [
      'session_expired',
      'failed',
      'awaiting_scan',
      'disabled',
      'not_connected',
      'reconnecting',
      'connecting',
      'removed',
    ];
    for (const candidate of priority) {
      if (states.includes(candidate)) return candidate;
    }
    return 'unknown';
  }

  /**
   * Persist a status change emitted by the engine, and flip the linked Social
   * row's publish state so the list shows "connected" numbers as published.
   */
  async applyStatusEvent(event: {
    name: string;
    status: string;
    phone?: string;
    pushName?: string;
    error?: string;
  }): Promise<void> {
    const session = await this.sessionModel.findOne({ name: event.name });
    if (!session) return;

    session.status = event.status;
    if (event.phone !== undefined) session.phone = event.phone || undefined;
    if (event.pushName !== undefined) session.pushName = event.pushName;
    if (event.error !== undefined) session.lastError = event.error;
    if (event.status === WhatsappWebSessionStatus.READY) {
      session.connectedAt = new Date();
      session.lastActiveAt = new Date();
      session.lastError = undefined;
    }
    await session.save();

    if (session.social) {
      const socialStatus =
        event.status === WhatsappWebSessionStatus.READY
          ? SocialStatusEnum.PUBLISHED
          : SocialStatusEnum.DRAFT;
      await this.socialService
        .updateWhatsappWebMeta(session.social.toString(), {
          status: socialStatus,
          sessionStatus: event.status,
        })
        .catch(() => undefined);
    }
  }
}
