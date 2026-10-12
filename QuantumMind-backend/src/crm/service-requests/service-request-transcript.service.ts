import { Inject, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import mongoose, { Connection, Types } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { SR_CHANGED, SrChangedEvent } from "./constants";
import { TRANSCRIPT_MAX, toTranscript, TranscriptLine } from "./transcript";

/**
 * Keeps the conversation with its request (crm-plugins-service-desk R16).
 *
 * A snapshot is taken when a request is created, when it closes, and before
 * the session lifecycle deletes the conversation's chats. The lifecycle calls
 * {@link snapshotForConversation} and keeps the chats if it throws (R16.2).
 */
@Injectable()
export class ServiceRequestTranscriptService {
  private readonly logger = new Logger(ServiceRequestTranscriptService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  @OnEvent(SR_CHANGED, { async: true })
  async onChanged(e: SrChangedEvent) {
    if (e.kind !== "created" && !e.closed) return;
    await this.snapshot(e.orgId, e.id).catch((error) =>
      this.logger.warn(`Transcript snapshot of ${e.id} failed: ${error?.message}`),
    );
  }

  /** Copy the conversation's chats onto one request. Returns the line count, or null without a conversation. */
  async snapshot(orgId: string, id: string): Promise<number | null> {
    const db = this.crm.forOrg(orgId);
    const sr = await db.serviceRequest.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, conversationId: true, botId: true, visitorId: true },
    });
    if (!sr) throw new NotFoundException("No such service request.");
    if (!sr.conversationId) return null;
    const lines = await this.read(sr.conversationId, sr.botId, sr.visitorId);
    if (lines === null) return null;
    // Chats already gone: never overwrite a good snapshot with an empty one.
    if (!lines.length) return 0;
    await db.serviceRequest.update({
      where: { id: sr.id },
      data: { transcript: lines as unknown as Prisma.InputJsonValue, transcriptAt: new Date() },
    });
    return lines.length;
  }

  /**
   * Snapshot every request of a conversation; throws when any fails, so the
   * caller keeps the chats (R16.2). No requests = nothing to keep.
   */
  async snapshotForConversation(conversationId: string): Promise<number> {
    const rows = await this.crm.client.serviceRequest.findMany({
      where: { conversationId: String(conversationId) },
      select: { id: true, organizationId: true },
    });
    for (const r of rows) await this.snapshot(r.organizationId, r.id);
    return rows.length;
  }

  /** Live chats while they exist, else the snapshot (R16.3). */
  async forRequest(orgId: string, id: string): Promise<{ source: "live" | "snapshot" | "none"; at: string | null; lines: TranscriptLine[] }> {
    const sr = await this.crm.forOrg(orgId).serviceRequest.findFirst({
      where: { id, organizationId: orgId },
      select: { conversationId: true, botId: true, visitorId: true, transcript: true, transcriptAt: true },
    });
    if (!sr) throw new NotFoundException("No such service request.");
    if (sr.conversationId) {
      const live = await this.read(sr.conversationId, sr.botId, sr.visitorId).catch(() => null);
      if (live && live.length) return { source: "live", at: new Date().toISOString(), lines: live };
    }
    const snap = Array.isArray(sr.transcript) ? (sr.transcript as unknown as TranscriptLine[]) : [];
    return snap.length
      ? { source: "snapshot", at: sr.transcriptAt?.toISOString() ?? null, lines: snap }
      : { source: "none", at: null, lines: [] };
  }

  /** A conversation's lines before any request exists (wrap-up draft). Empty when unreadable. */
  async linesForConversation(conversationId: string, botId?: string | null, visitorId?: string | null): Promise<TranscriptLine[]> {
    return (await this.read(String(conversationId), botId, visitorId).catch(() => null)) ?? [];
  }

  /** Chat rows of a conversation as transcript lines; null when Mongo is not reachable here. */
  private async read(conversationId: string, botId?: string | null, visitorId?: string | null): Promise<TranscriptLine[] | null> {
    const Chat = this.model("Chat");
    if (!Chat || !Types.ObjectId.isValid(conversationId)) return null;
    const rows: any[] = await Chat.find({ conversationId })
      .sort({ time: -1, createdAt: -1 })
      .limit(TRANSCRIPT_MAX)
      .select("message sender direction type time createdAt secured authorName")
      .lean();
    return toTranscript(rows, { botId, visitorId });
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}
