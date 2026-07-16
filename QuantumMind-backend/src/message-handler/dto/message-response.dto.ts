export class MessageResponseDto {
  value: any;
  type: string;
  id: string;
  from?: string;
  senderId?: string;
  time?: any;
  buttons?: any;
  delay?: number;
  switchToAgent?: boolean;
  agentId?: string;
  sender?: string;
  location?: any;
  info?: string;
  handledByAgent?: boolean;
}
