import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChatDirectionEnum } from '../enums/chat-direction.enum';
import { ChatStatusEnum } from '../enums/chat-status.enum';
import { ChatTypeEnum } from '../enums/chat-type.enum';

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  // Not @IsNotEmpty: a media-only message (an image with no caption) has an
  // empty body but is still a real message that must be stored.
  @IsOptional()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  sender: string;

  @IsOptional()
  @IsString()
  @IsEnum(ChatTypeEnum)
  type: string;

  chatId?: string;

  // --- Channel message fields (WhatsApp Web / Telegram / ...) ---------------
  // All optional so widget and bot chats keep using this DTO unchanged.

  @IsOptional()
  @IsString()
  channelThread?: string;

  @IsOptional()
  @IsString()
  externalMessageId?: string;

  @IsOptional()
  @IsEnum(ChatDirectionEnum)
  direction?: string;

  @IsOptional()
  @IsEnum(ChatStatusEnum)
  status?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mimetype?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsBoolean()
  mediaOmitted?: boolean;

  @IsOptional()
  @IsString()
  quotedMessageId?: string;

  @IsOptional()
  @IsBoolean()
  historical?: boolean;

  /** Explicit timestamp; history backfill must keep the original message time. */
  @IsOptional()
  time?: Date;
}
