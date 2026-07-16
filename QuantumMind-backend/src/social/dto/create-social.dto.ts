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
  engageBot: string;
}
