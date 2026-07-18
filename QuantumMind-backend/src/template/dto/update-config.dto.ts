import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateConfigDto {
  @ApiProperty({
    type: 'object',
    description: 'Key/value map of config overrides consumed by the template',
  })
  @IsObject()
  configValues: Record<string, any>;
}
