import {
  IsArray,
  IsBase64,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Bot } from "src/bots/entities";
import { Tag } from "src/tag/entities/tag.entity";
import { AgentStatusEnum } from "../enums/agent-status.enum";
import { ApiProperty, ApiResponse } from "@nestjs/swagger";
import { ObjectId } from "mongoose";

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Name of the agent",
    example: "Agent 1",
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: "Email of the agent",
    example: "agent@email.com",
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Password of the agent",
    example: "123456",
  })
  password: string;

  @IsBoolean()
  @IsOptional()
  active: boolean;

  @IsEnum(AgentStatusEnum)
  @IsOptional()
  @ApiProperty({
    enum: AgentStatusEnum,
  })
  status: AgentStatusEnum;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: "Assign bots to agent",
    example: ["5f9e1b9b9c9b9c0b8c8c8c8c"],
  })
  assignedBots: [ObjectId];

  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    description: "Tags for the agent",
    example: ["5f9e1b9b9c9b9c0b8c8c8c8c"],
  })
  tags: [ObjectId];

  @IsBase64()
  @IsOptional()
  @ApiProperty({
    description: "base64 Profile picture of the agent",
  })
  profilePic: string;
}
