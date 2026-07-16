import { INestApplicationContext, WebSocketAdapter } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import socketio, { ServerOptions } from 'socket.io';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';
import { TokenService } from 'src/token/token.service';
import { ModeEnum } from 'src/widget/enums/mode.enum';
import { SocketJwtPayload, WidgetService } from 'src/widget/widget.service';
import { SocketStateService } from './socket-state.service';
interface SocketAuthData {
  readonly role: string;
  readonly userId: string;
  readonly name?: string;
  readonly email?: string;
  readonly adminId?: string;
  readonly mode?: ModeEnum;
}

export interface AuthenticatedSocket extends socketio.Socket {
  auth: SocketAuthData;
}
export class SocketStateAdapter extends IoAdapter implements WebSocketAdapter {
  public constructor(
    private readonly app: INestApplicationContext,
    private readonly socketStateService: SocketStateService,
    private readonly redisPropagatorService: RedisPropagatorService,
  ) {
    super(app);
  }

  private server: socketio.Server;

  public create(
    port: number,
    options: ServerOptions & { namespace?: string },
  ): socketio.Server {
    this.server = super.createIOServer(port, options);
    this.redisPropagatorService.injectSocketServer(this.server);
    const tokenService = this.app.get(TokenService);
    const widgetService = this.app.get(WidgetService);
    this.server.use(AuthMiddleware(tokenService, widgetService));

    return this.server;
  }

  public bindClientConnect(server: socketio.Server, callback: any): void {
    server.on('connection', (socket: AuthenticatedSocket) => {
      if (socket.auth) {
        this.socketStateService.add(socket.auth.userId, socket);

        socket.on('disconnect', () => {
          this.socketStateService.remove(socket.auth.userId, socket);

          socket.removeAllListeners('disconnect');
        });
      }

      callback(socket);
    });
  }
}
export const AuthMiddleware =
  (tokenService: TokenService, widgetService: WidgetService) =>
  async (socket: AuthenticatedSocket, next: any) => {
    let token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      //socket.disconnect(true);

      const { accessToken } = await widgetService.createVisitor(
        {
          name: '',
          email: '',
        },
        '',
        {
          botId: '63b3c4f389f60e8e3a8df60b',
          mode: ModeEnum.live,
        },
      );

      token = accessToken;

      //return next();
      //return next(new Error('No token provided'));
    }

    try {
      const decoded: SocketJwtPayload = tokenService.verify(token);
      socket.auth = {
        userId: decoded._id,
        ...decoded,
      };
      next();
    } catch (e) {
      return next(e);
    }
  };
