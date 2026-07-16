import { ConversationStatusEnum } from '../enums/conversation-status.enum';
import { ConversationTypeEnum } from '../enums/conversation-type.enum';
import { IsString, IsOptional } from 'class-validator';

export class SearchConversationDto {
  @IsOptional()
  @IsString()
  status: ConversationStatusEnum;

  @IsOptional()
  @IsString()
  type: ConversationTypeEnum;
}
