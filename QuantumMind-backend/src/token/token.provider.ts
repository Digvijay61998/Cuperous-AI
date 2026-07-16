import { DATABASE_PROVIDER } from 'src/constants';
import { TOKEN_PROVIDER } from 'src/constants';
import { Token, TokenSchema } from './entities/token.entity';
import { Connection } from 'mongoose';

export const tokenProviders = [
  {
    provide: TOKEN_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Token.name, TokenSchema),
    inject: [DATABASE_PROVIDER],
  },
];
