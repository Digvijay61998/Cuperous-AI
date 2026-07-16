import { Global, Module } from '@nestjs/common';
import { TokenService } from './token.service';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { tokenProviders } from './token.provider';

@Global()
@Module({
  providers: [TokenService, ...tokenProviders],
  exports: [TokenService],
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.signOptions.expiresIn'),
          issuer: configService.get('jwt.signOptions.issuer'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class TokenModule {}
