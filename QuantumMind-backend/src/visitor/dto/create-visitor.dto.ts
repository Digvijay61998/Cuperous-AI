import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVisitorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email?: string;

  @IsNotEmpty()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  bot: string;

  username?: string;

  platform?: string;
}
