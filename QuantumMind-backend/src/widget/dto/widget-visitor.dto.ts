import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ModeEnum } from '../enums/mode.enum';

export class WidgetVisitorDTO {
  @IsString()
  @IsOptional()
  @IsEnum(ModeEnum)
  mode: ModeEnum;
}
