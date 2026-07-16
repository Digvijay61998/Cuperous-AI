import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ChatTypeEnum } from '../enums/chat-type.enum';

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
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
}
