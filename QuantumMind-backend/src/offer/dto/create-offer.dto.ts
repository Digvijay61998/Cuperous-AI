import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

import { Cards } from '../entities/offer.entity';
import { OfferStatusEnum } from '../enums/offer-status.enum';

export class CreateOfferDto {
  @IsString()
  title: string;

  @IsArray()
  assignedToBots: string[];

  @IsArray()
  cards: Cards[];

  @IsEnum(OfferStatusEnum)
  @IsOptional()
  status: OfferStatusEnum;
}
