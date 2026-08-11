import { IsNotEmpty, IsString } from 'class-validator';
export class CreateTelegramBotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  telegramBotId: string;

  @IsString()
  @IsNotEmpty()
  jarcubeBot: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
