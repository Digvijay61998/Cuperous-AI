import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChatTypeEnum } from 'src/conversation/enums/chat-type.enum';

/** The message kinds an agent may send from the inbox. */
export const INBOX_SENDABLE_TYPES = [
  ChatTypeEnum.TEXT,
  ChatTypeEnum.IMAGE,
  ChatTypeEnum.VIDEO,
  ChatTypeEnum.AUDIO,
  ChatTypeEnum.FILE,
] as const;

/**
 * An agent reply.
 *
 * `message` is optional at the type level because a media-only reply is valid;
 * the "text or media, but not neither" rule is enforced in the service, where a
 * `400` can name which of the two was missing.
 */
export class SendInboxMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  // 4096 is WhatsApp's own text ceiling. Rejecting here rather than letting the
  // channel truncate means the agent finds out before the customer sees half a
  // sentence.
  @MaxLength(4096)
  message?: string;

  @IsOptional()
  @IsString()
  @IsIn(INBOX_SENDABLE_TYPES as unknown as string[])
  type?: string;

  /**
   * Absolute URL of an already-uploaded attachment.
   *
   * Must be absolute and fetchable without an agent credential: the channel
   * fetches this URL server-side (baileys is handed `{ image: { url } }`), so a
   * relative path or an auth-gated link fails inside the engine rather than here.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mimetype?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  /** Channel-native id of the message being replied to. */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  quotedMessageId?: string;

  /**
   * Client-generated correlation id for this reply.
   *
   * The join key between the optimistic bubble the dashboard renders at submit
   * time and the echo that arrives over the socket a moment later. The server
   * stores it on the row and echoes it back verbatim, which is what lets the two
   * fold into one message instead of rendering twice.
   *
   * Optional so a non-interactive caller need not invent one — the server mints
   * one in that case. Length-capped because it is persisted and indexed on.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  correlationId?: string;
}
