import { IsArray, IsString } from 'class-validator';
import { Posters } from '../entities/advertisement.entity';

export class CreateAdvertisementDto {
  @IsString()
  title: string;

  @IsArray()
  assignedToBots: string[];

  @IsArray()
  posters: Posters[];
}
