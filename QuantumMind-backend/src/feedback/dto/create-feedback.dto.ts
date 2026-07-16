import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FeedbackForEnum } from '../enums/feedback-for.enum';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(FeedbackForEnum)
  feedbackFor: FeedbackForEnum;

  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @IsNumber()
  rating: number;

  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  @IsNotEmpty()
  visitor: string;

  @IsString()
  @IsOptional()
  agent?: string;

  @IsString()
  @IsNotEmpty()
  bot: string;

  @IsString()
  @IsNotEmpty()
  conversation: string;
}
