import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { AlertResolutionEnum } from "../enums/handover-alert.enum";

/** `ended` is server-only; a user can only open or take over. */
export class AckHandoverAlertDto {
  @ApiProperty({ enum: [AlertResolutionEnum.OPENED, AlertResolutionEnum.TAKEN_OVER] })
  @IsIn([AlertResolutionEnum.OPENED, AlertResolutionEnum.TAKEN_OVER])
  resolution: AlertResolutionEnum.OPENED | AlertResolutionEnum.TAKEN_OVER;
}
