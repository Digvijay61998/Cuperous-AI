import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidateIf,
} from "class-validator";
import { COUNTRY_DEFAULT_ZONE } from "src/common/time/country-zones";
import { isValidTimeZone } from "src/common/time/org-time";

@ValidatorConstraint({ name: "isKnownCountry" })
class IsKnownCountry implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === "string" && value.toUpperCase() in COUNTRY_DEFAULT_ZONE;
  }
  defaultMessage() {
    return "country must be an ISO 3166-1 alpha-2 code (e.g. IN, FI, US)";
  }
}

@ValidatorConstraint({ name: "isIanaTimeZone" })
class IsIanaTimeZone implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isValidTimeZone(value);
  }
  defaultMessage() {
    return "timeZone must be a valid IANA time zone (e.g. Asia/Kolkata)";
  }
}

/** Body for PATCH /me/organization/settings. `null` clears a value. */
export class UpdateOrgSettingsDto {
  @ApiPropertyOptional({ example: "IN", nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @Matches(/^[A-Za-z]{2}$/)
  @Validate(IsKnownCountry)
  country?: string | null;

  @ApiPropertyOptional({ example: "Asia/Kolkata", nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @Validate(IsIanaTimeZone)
  timeZone?: string | null;
}
