import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class OverrideOwnerDto {
  /** Agent to hand the chat to. Omitted: the admin takes it. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  targetAgentId?: string;
}
