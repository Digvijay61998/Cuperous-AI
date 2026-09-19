import {
  IsArray,
  IsBase64,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Bot } from "src/bots/entities";
import { Tag } from "src/tag/entities/tag.entity";
import { AgentStatusEnum } from "../enums/agent-status.enum";
import { ApiProperty, ApiResponse } from "@nestjs/swagger";
import { ObjectId } from "mongoose";
import { Role } from "src/common/enums/role.enum";

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

  /**
   * Requested role for the new user. Validated server-side against the
   * creator's role (delegated administration); a client can never escalate
   * beyond what its own role permits. Defaults to AGENT.
   */
  @IsEnum(Role)
  @IsOptional()
  @ApiProperty({ enum: Role, required: false })
  role?: Role;

  /**
   * Target organization. Only honored for a SUPER_ADMIN creating an ORG_ADMIN;
   * for org-scoped creators the new user is always pinned to the creator's own
   * organization regardless of this value.
   */
  @IsMongoId()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: "Target organization (SUPER_ADMIN only)",
  })
  organizationId?: string;
}
