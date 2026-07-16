import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ScrapeStatusEnum } from '../enum/scrape-status.enum';

export class UpdateScrapeDto {
  @IsEnum(ScrapeStatusEnum)
  @IsOptional()
  status: string;
}
