import { PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { AdvertisementStatus } from '../enums/advertisement-status.enum';
import { CreateAdvertisementDto } from './create-advertisement.dto';

export class UpdateAdvertisementDto extends PartialType(
  CreateAdvertisementDto,
) {
  @IsOptional()
  @IsArray()
  unassignedToBots: string[];

  @IsEnum(AdvertisementStatus)
  @IsOptional()
  status: AdvertisementStatus;
}
