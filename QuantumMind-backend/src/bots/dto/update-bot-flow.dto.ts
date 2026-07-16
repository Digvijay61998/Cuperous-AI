import { IsNotEmpty, IsArray, IsOptional } from "class-validator";

export class UpdateBotFlowDto {
  @IsNotEmpty()
  @IsArray()
  edges: [];
  @IsNotEmpty()
  @IsArray()
  nodes: [];

  @IsArray()
  @IsOptional()
  customAttributes?: any[];
}
