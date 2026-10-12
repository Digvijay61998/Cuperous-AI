import { INestApplicationContext, WebSocketAdapter } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import socketio, { ServerOptions } from 'socket.io';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';
import { TokenService } from 'src/token/token.service';
import { ModeEnum } from 'src/widget/enums/mode.enum';
import { SocketJwtPayload, WidgetService } from 'src/widget/widget.service';
import { OrganizationService } from 'src/organization/organization.service';
import { isPlatformRole, Role } from 'src/common/enums/role.enum';
import { SocketStateService } from './socket-state.service';
interface SocketAuthData {
  readonly role: string;
  readonly userId: string;
  readonly name?: string;
  readonly email?: string;
  readonly adminId?: string;
  readonly mode?: ModeEnum;
  readonly organizationId?: string | null;
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
    const organizationService = this.app.get(OrganizationService);
    this.server.use(
      AuthMiddleware(tokenService, widgetService, organizationService),
    );

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

/**
 * Socket handshake auth.
 *
 * Tokens are REQUIRED. The previous behaviour — minting an anonymous visitor on
 * a hard-coded bot when no token was sent — let any unauthenticated client open
 * a live socket against a specific tenant's bot; widgets always obtain a
 * visitor token from `POST /widget` + `POST /widget/visitor` first.
 *
 * Dashboard users (platform roles) are additionally rejected when their org is
 * suspended, mirroring the HTTP SuspendedOrgGuard.
 */
export const AuthMiddleware =
  (
    tokenService: TokenService,
    _widgetService: WidgetService,
    organizationService?: OrganizationService,
  ) =>
  async (socket: AuthenticatedSocket, next: any) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers['token'];

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const raw = String(token).replace(/^Bearer\s+/i, '');
      const decoded: SocketJwtPayload & { organizationId?: string | null } =
        tokenService.verify(raw);

      if (
        isPlatformRole(decoded.role) &&
        decoded.role !== Role.SUPER_ADMIN &&
        decoded.organizationId &&
        organizationService &&
        (await organizationService.isSuspended(String(decoded.organizationId)))
      ) {
        return next(new Error('Your organization has been suspended'));
      }

      socket.auth = {
        userId: decoded._id,
        ...decoded,
      };
      next();
    } catch (e) {
      return next(e);
    }
  };
