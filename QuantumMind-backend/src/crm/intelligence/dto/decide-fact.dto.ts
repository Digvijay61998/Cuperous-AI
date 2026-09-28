import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class DecideFactDto {
  @ApiProperty({ enum: ["accept", "dismiss"] })
  @IsIn(["accept", "dismiss"])
  decision: "accept" | "dismiss";
}
