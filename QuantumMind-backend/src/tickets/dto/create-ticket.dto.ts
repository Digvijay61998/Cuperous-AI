import { TicketPriorityEnum } from '../enums/ticket-priority';
import { IsArray, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  description?: string;

  @IsString()
  priority?: TicketPriorityEnum;

  @IsString()
  bot: string;
  visitor: string;
  agents?: string[];

  @IsString()
  conversationId: string;

  @IsArray()
  tags?: string[];
}
