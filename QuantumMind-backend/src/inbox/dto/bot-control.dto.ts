import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export const BOT_CONTROL_ACTIONS = ['takeover', 'release'] as const;
export type BotControlAction = (typeof BOT_CONTROL_ACTIONS)[number];

/**
 * Per-thread bot control.
 *
 * `botEnabled` and `action` are mutually exclusive by design, enforced in the
 * service. `assignToAgent` and `releaseToBot` each already write `botEnabled`
 * themselves, so accepting both fields would give one field two authorities and
 * make the result depend on which was applied last.
 */
export class BotControlDto {
  @IsOptional()
  @IsBoolean()
  botEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(BOT_CONTROL_ACTIONS as unknown as string[])
  action?: BotControlAction;
}
