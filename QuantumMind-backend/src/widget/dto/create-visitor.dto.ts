import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';

/** Stored widget session (crm-incident-handover R9.3). */
export class ResumeSessionDto {
  @IsOptional()
  @IsMongoId()
  visitorId?: string;

  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}

export class CreateVisitor {
  @IsString()
  @IsOptional()
  name: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  /** Resume this visitor (and conversation, if still open) after a reload. */
  @IsOptional()
  @ValidateNested()
  @Type(() => ResumeSessionDto)
  resume?: ResumeSessionDto;

  /** "Start new chat": same visitor, new conversation, never resume. */
  @IsOptional()
  @IsBoolean()
  newConversation?: boolean;
}
