import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SocialPlatformEnum } from '../enums/social-platform.enum';

export class CreateSocialDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  botId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(SocialPlatformEnum)
  platform: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  jarcubeBot: string;

  /**
   * WhatsApp Cloud API sending phone number id. Not @IsString: the dashboard
   * form posts it from a numeric input, so it can arrive as a number. The
   * service normalises it to a string.
   */
  @IsOptional()
  phoneNumberId?: string | number;
}
