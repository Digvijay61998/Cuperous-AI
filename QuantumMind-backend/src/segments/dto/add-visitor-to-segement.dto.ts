import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddVisitorToSegmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  visitorId: string;
}
