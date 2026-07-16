import { PartialType } from '@nestjs/swagger';
import { CreateBotDto } from './create-bot.dto';
import { IsBoolean } from 'class-validator';

export class UpdateBotDto extends PartialType(CreateBotDto) {
  @IsBoolean()
  published: boolean;
}
