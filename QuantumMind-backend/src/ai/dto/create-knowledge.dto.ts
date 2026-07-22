import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  // Stable key so the same entry can be re-edited/replaced. Auto-generated when
  // omitted.
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  botId?: string;
}
