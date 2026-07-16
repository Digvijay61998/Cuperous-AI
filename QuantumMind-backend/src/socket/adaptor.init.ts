import { INestApplication } from '@nestjs/common';
import { SocketStateAdapter } from './socket.adaptor';
import { SocketStateService } from './socket-state.service';
import { RedisPropagatorService } from 'src/redis-propagate/redis-propagate.service';

export const initAdapters = (app: INestApplication): INestApplication => {
  const socketStateService = app.get(SocketStateService);
  const redisPropagatorService = app.get(RedisPropagatorService);

  app.useWebSocketAdapter(
    new SocketStateAdapter(app, socketStateService, redisPropagatorService),
  );

  return app;
};
