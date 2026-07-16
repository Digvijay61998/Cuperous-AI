import { IsNotEmpty, IsString } from 'class-validator';

export class ClickDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  tag: string;

  @IsNotEmpty()
  @IsString()
  id: string;
}
