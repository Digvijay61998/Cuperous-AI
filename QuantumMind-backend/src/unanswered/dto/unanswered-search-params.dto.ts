import { IsString, IsOptional } from 'class-validator';

export class UnansweredSearchParamsDto {
  @IsOptional()
  @IsString()
  botId?: string;
}
