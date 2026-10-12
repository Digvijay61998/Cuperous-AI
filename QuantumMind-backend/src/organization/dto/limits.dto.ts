import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Per-org limit overrides. Only known keys, non-negative integers. */
export class LimitsOverrideDto {
  @IsOptional() @IsInt() @Min(0) @Max(100000)
  @ApiPropertyOptional({ example: 3 })
  maxBots?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100000)
  @ApiPropertyOptional({ example: 10 })
  maxAgents?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100000)
  @ApiPropertyOptional({ example: 3 })
  maxPlatforms?: number;

  @IsOptional() @IsInt() @Min(0) @Max(100000)
  @ApiPropertyOptional({ example: 20 })
  maxTemplates?: number;
}

/** Keeps only the four known limit keys (drops anything else). */
export function pickLimits(
  limits?: Partial<LimitsOverrideDto> | null,
): Partial<LimitsOverrideDto> | undefined {
  if (!limits) return undefined;
  const out: Partial<LimitsOverrideDto> = {};
  for (const k of ['maxBots', 'maxAgents', 'maxPlatforms', 'maxTemplates'] as const) {
    if (limits[k] !== undefined && limits[k] !== null) out[k] = limits[k];
  }
  return out;
}

/** Throws unless every value in a feature map is a boolean. */
export function assertBooleanMap(map?: Record<string, unknown> | null) {
  if (!map) return;
  for (const [k, v] of Object.entries(map)) {
    if (typeof v !== 'boolean') {
      throw new Error(`Feature '${k}' must be true or false`);
    }
  }
}
