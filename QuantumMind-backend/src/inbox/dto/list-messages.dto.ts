import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query for one thread's message window.
 *
 * The default of 50 and ceiling of 200 mirror the fetch-window thinking in
 * OpenWA's dashboard: a bounded window is what keeps both the DOM and the
 * client cache bounded, since neither side virtualises the list.
 */
export class ListMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /**
   * Cursor for paging backwards through the thread: returns messages strictly
   * older than this. Paired with `hasMore` in the response, this is the
   * "load older" path OpenWA's dashboard lacks.
   */
  @IsOptional()
  @IsDateString()
  before?: string;
}
