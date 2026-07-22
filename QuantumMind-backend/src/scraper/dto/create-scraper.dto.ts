import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ScrapeStatusEnum } from '../enum/scrape-status.enum';

export class CreateScrapeDto {
  // @IsNotEmpty()
  // @IsString()
  // title: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsOptional()
  @IsArray()
  tags: [];

  // Tenant/knowledge-base this scrape belongs to (optional; can be supplied at
  // ingest time instead).
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  botId?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  // @IsEnum(ScrapeStatusEnum)
  // @IsOptional()
  // status: string;
}
