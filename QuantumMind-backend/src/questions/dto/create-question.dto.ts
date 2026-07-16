import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export interface QuestionLanguage {
  label: string;
  value: string;
}

class CreateQuestionDto {
  @IsOptional()
  questionLanguage: QuestionLanguage;

  @IsString({
    message: "Question must be a string",
  })
  question: string;

  @IsArray()
  @IsNotEmpty({
    message: "Answers must be an array of strings",
  })
  answers: string[];

  @IsArray()
  @IsOptional()
  keywords: string[];
}

export class CreateSingleQuestionDto extends CreateQuestionDto {
  @IsArray({
    message: "Tags must be an array",
  })
  @IsOptional()
  tags: string[];
}

export class CreateMultipleQuestionsDto {
  @IsArray({
    message: "Questions must be an array",
  })
  questions: CreateQuestionDto[];

  @IsArray({
    message: "Tags must be an array",
  })
  @IsOptional()
  tags: string[];

  @IsOptional()
  questionLanguage: QuestionLanguage;
}
