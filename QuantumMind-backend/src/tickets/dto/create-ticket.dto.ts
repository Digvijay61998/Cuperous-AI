import { TicketPriorityEnum } from '../enums/ticket-priority';
import { IsArray, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

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

  // --- crm-incident-handover (optional, additive; R1.2, R15.4) -------------

  /** The Incident this Service Request tracks. */
  @IsOptional()
  @IsMongoId()
  incident?: string;

  /** CRM (Postgres) contact cuid. */
  @IsOptional()
  @IsString()
  crmContactId?: string;

  @IsOptional()
  @IsIn(['chat', 'dashboard', 'api'])
  source?: 'chat' | 'dashboard' | 'api';
}
