export class RedisSocketEventSendDTO {
  public readonly userId: string;
  public readonly socketId?: string;
  public readonly event: string;
  public readonly data: any;
  public readonly platform?: string;
}
