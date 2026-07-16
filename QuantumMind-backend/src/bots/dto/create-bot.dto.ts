import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ObjectId } from "mongoose";

export class CreateBotDto {
  @ApiProperty({
    description: "Name of the bot",
    example: "Bot 1",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "primaryColor of the bot",
    example: "#000000",
  })
  primaryColor: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: "Agents of the bot",
    example: ["5f9e1b9b9c9b9c0b8c8c8c8c"],
  })
  agents: [string];

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: "Tags of the bot",
    example: ["5f9e1b9b9c9b9c0b8c8c8c8c"],
  })
  tags: [string];
}
