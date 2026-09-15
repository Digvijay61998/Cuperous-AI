import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Common visitor/conversation context every hosted-template action submits
 * alongside its action-specific fields (see template-sdk actions.ts
 * withContext()). Action-specific fields are intentionally NOT declared here:
 * the global ValidationPipe runs without `whitelist`, so extra properties
 * pass through untouched and are captured as-is in
 * TemplateActionSubmission.payload.
 */
export class CreateTemplateActionDto {
  @ApiProperty({ description: 'Template this submission was made from' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  botId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Optional idempotency key for retried submissions',
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}
