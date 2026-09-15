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
  /**
   * Present only on ChatTypeEnum.TEMPLATE messages. Carries the launch URL as
   * structured data so the web widget can open the template in an embedded
   * panel rather than parsing it back out of the message text.
   */
  template?: { url: string; buttonText: string };
}
