import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Query for the channel inbox thread list.
 *
 * `channel` is a free-form string, not an enum, deliberately: ChannelThread.channel
 * is free-form so a new platform (instagram, discord, a mobile SDK) needs no
 * change here. An unknown value simply returns an empty list.
 */
export class ListThreadsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string;

  /** Matches pushName / phone / chatId, case-insensitive. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Cursor from the previous page's `nextCursor`. Returns threads strictly older
   * than this timestamp.
   */
  @IsOptional()
  @IsDateString()
  before?: string;
}
