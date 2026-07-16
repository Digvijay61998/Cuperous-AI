import { PartialType } from '@nestjs/swagger';
import { CreateAgentDto } from './create-agent.dto';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateAgentDto extends PartialType(CreateAgentDto) {}
