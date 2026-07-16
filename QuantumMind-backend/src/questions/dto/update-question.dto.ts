import { PartialType } from '@nestjs/swagger';
import { CreateSingleQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateSingleQuestionDto) {}
