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
   * Author category for rendering: `visitor` on one side, everything the org
   * sends (`bot` — flow/AI — and `agent`) on the other. Clients must not infer
   * the side from `senderId`, which agent replies do not always carry.
   */
  senderRole?: "visitor" | "bot" | "agent" | "system";
  /**
   * Present only on ChatTypeEnum.TEMPLATE messages. Carries the launch URL as
   * structured data so the web widget can open the template in an embedded
   * panel rather than parsing it back out of the message text.
   */
  template?: { url: string; buttonText: string };
}
