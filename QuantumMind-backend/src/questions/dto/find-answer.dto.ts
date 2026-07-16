import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FindAnswerDto {
  @IsString()
  @IsNotEmpty()
  readonly question: string;

  @IsOptional()
  @ApiPropertyOptional()
  readonly tags: string[];

  @IsOptional()
  @ApiPropertyOptional()
  @ApiProperty({
    default: 'en',
  })
  readonly language: string;
}
