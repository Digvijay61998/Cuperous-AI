import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { CreateAgentDto } from './create-agent.dto';

/**
 * `organizationId` can never be changed through an update (one org per user;
 * moving a user across tenants is not a supported operation). `role` is
 * accepted but validated server-side by the delegated-administration rule in
 * `AgentService.update`.
 */
export class UpdateAgentDto extends PartialType(
  OmitType(CreateAgentDto, ['organizationId', 'role'] as const),
) {
  @IsEnum(Role)
  @IsOptional()
  @ApiProperty({ enum: Role, required: false })
  role?: Role;
}
