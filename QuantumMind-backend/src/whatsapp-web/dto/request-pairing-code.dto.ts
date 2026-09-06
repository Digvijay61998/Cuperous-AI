import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestPairingCodeDto {
  /** Phone number to link, digits only in international format (country code + number). */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6,15}$/, {
    message:
      'phoneNumber must be digits only in international format (country code + number), e.g. 628123456789',
  })
  phoneNumber: string;
}
