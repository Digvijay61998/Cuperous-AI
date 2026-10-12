import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  handoverSound?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  messageSound?: boolean;
}
