import { Questions } from '../entities/unanswered.entity';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

class QuestionsDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  askedBy: string;

  @IsString()
  @IsOptional()
  time: Date;
}

export class CreateUnansweredDto {
  @IsString()
  @IsNotEmpty()
  botId: string;

  @IsNotEmpty()
  questions: QuestionsDto;
}
