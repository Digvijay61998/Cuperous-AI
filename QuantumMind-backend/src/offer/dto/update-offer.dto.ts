import { PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OfferStatusEnum } from '../enums/offer-status.enum';
import { CreateOfferDto } from './create-offer.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}
