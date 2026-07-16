import { IsEnum } from 'class-validator';
import { QuestionStatusEnum } from '../enums/question-status.enum';

export class UpdateQuestionStatusDto {
  @IsEnum(QuestionStatusEnum)
  status: QuestionStatusEnum;
}
