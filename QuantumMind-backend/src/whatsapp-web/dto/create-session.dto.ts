import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateWhatsappWebSessionDto {
  /**
   * Unique session name. Constrained to the same shape OpenWA uses because it
   * becomes the on-disk auth-directory key: lowercase letters, digits, hyphens.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'name can only contain lowercase letters, numbers and hyphens',
  })
  name: string;

  /** The JarCube Bot inbound messages from this session are routed to. */
  @IsString()
  @IsNotEmpty()
  jarcubeBot: string;
}
