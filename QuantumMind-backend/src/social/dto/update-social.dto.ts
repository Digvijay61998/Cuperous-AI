import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateSocialDto } from './create-social.dto';

export class UpdateSocialDto extends PartialType(CreateSocialDto) {
  @IsOptional()
  status?: string;
}
