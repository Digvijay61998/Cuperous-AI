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
import { SocialService } from 'src/social/social.service';
import { SocialStatusEnum } from 'src/social/enums/social-status.enum';
import { BaileysEngineService } from './engine/baileys-engine.service';
import { WHATSAPP_WEB_SESSION_PROVIDER } from './constants';
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
