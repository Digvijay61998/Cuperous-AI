import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryParamDto {
  @IsOptional()
  @ApiPropertyOptional()
  botId: string;
}
