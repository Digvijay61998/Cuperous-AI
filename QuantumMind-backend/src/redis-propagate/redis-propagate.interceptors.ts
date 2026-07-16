import {
  NestInterceptor,
  Injectable,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { WsResponse } from '@nestjs/websockets';
import { RedisPropagatorService } from './redis-propagate.service';
import { Observable, tap } from 'rxjs';
import { AuthenticatedSocket } from 'src/socket/socket.adaptor';

@Injectable()
export class RedisPropagatorInterceptor<T>
  implements NestInterceptor<T, WsResponse<T>>
{
  public constructor(
    private readonly redisPropagatorService: RedisPropagatorService,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WsResponse<T>> {
    const socket: AuthenticatedSocket = context.switchToWs().getClient();

    return next.handle().pipe(
      tap((data) => {
        this.redisPropagatorService.propogateToSelf({
          ...data,
          socketId: socket.id,
          userId: socket.auth?.userId,
        });
      }),
    );
  }
}
