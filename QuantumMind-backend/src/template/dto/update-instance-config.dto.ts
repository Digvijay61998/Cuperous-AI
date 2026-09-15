import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInstanceConfigDto {
  @ApiProperty({
    description: 'Bot whose configuration is being edited (the tenant key)',
  })
  @IsString()
  @MaxLength(128)
  botId: string;

  @ApiProperty({
    type: 'object',
    description: 'Key/value map of this customer’s config overrides',
  })
  @IsObject()
  configValues: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Workspace the bot belongs to, stored for dashboard filtering',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  workspaceId?: string;
}
