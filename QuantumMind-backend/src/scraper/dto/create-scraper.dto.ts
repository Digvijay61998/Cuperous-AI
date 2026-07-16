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

  // @IsEnum(ScrapeStatusEnum)
  // @IsOptional()
  // status: string;
}
