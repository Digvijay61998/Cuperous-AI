import { IsNotEmpty, IsEmail } from 'class-validator';

export class SendTranscriptDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  visitorId: string;
}
