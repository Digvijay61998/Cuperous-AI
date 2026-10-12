import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { toArray, toBool } from "../../common/list.util";

/** Comma-separated or repeated query values -> array. */
const list = ({ value }: { value: unknown }) =>
  toArray(value).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);

/** GET /crm/service-requests (crm-plugins-service-desk R11, R12). */
export class ListServiceRequestsDto {
  @ApiPropertyOptional({ enum: ["board", "list"] })
  @IsOptional()
  @IsIn(["board", "list"])
  view?: "board" | "list";

  @ApiPropertyOptional({ description: "Load more cards of one board column (stage id)." })
  @IsOptional()
  @IsString()
  column?: string;

  @ApiPropertyOptional({ description: "me | unassigned | any | user ids" })
  @IsOptional()
  @Transform(list)
  @IsArray()
  assignee?: string[];

  @IsOptional() @Transform(list) @IsArray() stageId?: string[];
  @IsOptional() @Transform(list) @IsArray() category?: string[];
  @IsOptional() @Transform(list) @IsArray() priority?: string[];
  @IsOptional() @Transform(({ value }) => toBool(value)) @IsBoolean() emergency?: boolean;
  @IsOptional() @Transform(list) @IsArray() botId?: string[];
  @IsOptional() @Transform(list) @IsArray() channel?: string[];
  @IsOptional() @Transform(list) @IsArray() source?: string[];
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() visitorId?: string;
  @IsOptional() @IsString() conversationId?: string;
  @IsOptional() @Transform(list) @IsArray() tags?: string[];
  @IsOptional() @IsString() createdFrom?: string;
  @IsOptional() @IsString() createdTo?: string;
  @IsOptional() @IsString() updatedFrom?: string;
  @IsOptional() @IsString() updatedTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24 * 365)
  olderThanHours?: number;

  @IsOptional() @IsString() @MaxLength(200) q?: string;

  @IsOptional() @IsIn(["created", "updated", "priority", "ref", "subject"]) sort?: string;
  @IsOptional() @IsIn(["asc", "desc"]) dir?: "asc" | "desc";
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number;
}

export class CreateServiceRequestDto {
  @IsString() @MinLength(1) @MaxLength(200) subject: string;
  @IsOptional() @IsString() @MaxLength(10_000) description?: string;
  @IsOptional() @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]) priority?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() botId?: string;
  @IsOptional() @IsString() conversationId?: string;
  @IsOptional() @IsString() visitorId?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsBoolean() emergency?: boolean;
}

export class UpdateServiceRequestDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) subject?: string;
  @IsOptional() @IsString() @MaxLength(10_000) description?: string | null;
  @IsOptional() @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]) priority?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
  /** null unlinks. */
  @IsOptional() @IsString() contactId?: string | null;
  @IsOptional() @IsBoolean() emergency?: boolean;
}

export class MoveServiceRequestDto {
  @IsString() stageId: string;
  @IsOptional() @IsString() aboveId?: string | null;
  @IsOptional() @IsString() belowId?: string | null;
}

export class AssignServiceRequestDto {
  /** null or empty unassigns. */
  @IsOptional() @IsString() assigneeId?: string | null;
}

export class CommentDto {
  @IsString() @MinLength(1) @MaxLength(5000) body: string;
}

export class StageDto {
  @IsOptional() @IsString() @MaxLength(40) name?: string;
  @IsOptional() @IsString() color?: string | null;
  @IsOptional() @IsIn(["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"]) category?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class StageOrderDto {
  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) ids: string[];
}

/** Which chat to wrap up: a conversation id, or an inbox thread id. */
export class WrapUpQueryDto {
  @IsOptional() @IsString() @MaxLength(64) conversationId?: string;
  @IsOptional() @IsString() @MaxLength(64) threadId?: string;
}

/** POST /crm/service-requests/wrap-up: the confirmed card before a chat closes or is released. */
export class WrapUpDto extends WrapUpQueryDto {
  @IsString() @MinLength(1) @MaxLength(200) subject: string;
  @IsOptional() @IsString() @MaxLength(10_000) description?: string | null;
  @IsOptional() @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]) priority?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() emergency?: boolean;
  @IsIn(["resolved", "open"]) outcome: "resolved" | "open";
  @IsBoolean() confirmed: boolean;
}
