import { Injectable } from "@nestjs/common";
import { tap } from "rxjs";
import { SocketStateService } from "src/socket/socket-state.service";
import { RedisService } from "../redis/redis.service";
import { SEND_TO_OTHER, SEND_TO_SELF } from "./constants";
import { RedisSocketEventSendDTO } from "./dto/RedisSocketEventSend.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { Server } from "socket.io";
import { PlatformEnum } from "src/conversation/enums/platform.enum";

@Injectable()
export class RedisPropagatorService {
  private socketServer: Server;

  public constructor(
    private readonly socketStateService: SocketStateService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.redisService
      .fromEvent(SEND_TO_OTHER)
      .pipe(tap(this.consumeSendEvent))
      .subscribe();

    this.redisService
      .fromEvent(SEND_TO_SELF)
      .pipe(tap(this.consumeSendToSelf))
      .subscribe();
  }

  public injectSocketServer(server: Server): RedisPropagatorService {
    this.socketServer = server;

    return this;
  }

  public propogateToSelf(eventInfo: RedisSocketEventSendDTO): boolean {
    if (!eventInfo.userId) {
      return false;
    }

    this.redisService.publish(SEND_TO_SELF, eventInfo);

    return true;
  }

  public propagateEvent(eventInfo: RedisSocketEventSendDTO): boolean {
    if (!eventInfo.userId) {
      return false;
    }

    this.redisService.publish(SEND_TO_OTHER, eventInfo);

    return true;
  }

  private consumeSendEvent = (eventInfo: RedisSocketEventSendDTO): void => {
    const { userId, event, data, platform } = eventInfo;
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { ctx } = userData;

    if (platform === PlatformEnum.WHATSAPP) {
      this.eventEmitter.emit("send-whatsapp-message", {
        ctx,
        message: data.message,
      });
    } else if (platform === PlatformEnum.FACEBOOK) {
      this.eventEmitter.emit("send-facebook-message", {
        ctx,
        message: data.message,
      });
    } else if (platform === PlatformEnum.TELEGRAM) {
      this.eventEmitter.emit("send-telegram-message", {
        ctx,
        message: data.message,
      });
    } else {
      const sockets = this.socketStateService.getSocket(userId);

      sockets &&
        sockets.length &&
        sockets.forEach((socket) => {
          socket.emit(event, data);
        });
    }
  };

  private consumeSendToSelf = (eventInfo: RedisSocketEventSendDTO): void => {
    const { userId, event, data, socketId } = eventInfo;

    this.socketStateService.getSocket(userId).forEach((socket) => {
      if (socket.id !== socketId) {
        socket.emit(event, data);
      }
    });
  };
}
