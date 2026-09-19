import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TOKEN_PROVIDER } from 'src/constants';
import { Model } from 'mongoose';
import { TokenDocument } from './entities/token.entity';
import { generateId } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async sign(payload: any, signOptions?: any): Promise<string> {
    return this.jwtService.sign(payload, signOptions);
  }

  verify(token: string) {
    return this.jwtService.verify(token);
  }

  async createRefreshToken(user: JwtPayload): Promise<string> {
    const refreshTokenExpiresIn = this.configService.get(
      'jwt.refreshExpiresInDays',
    );
    const refreshToken = await this.tokenModel.create({
      token: generateId('refresh_token', 40),
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? null,
      expiresAt: new Date(
        Date.now() + refreshTokenExpiresIn * 24 * 60 * 60 * 1000,
      ),
    });

    return refreshToken.token;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const token = await this.tokenModel.findOne({ token: refreshToken });

    if (token) {
      const signoptions = this.configService.get('jwt.signOptions');
      const accessToken = await this.sign(
        {
          _id: token.userId,
          email: token.email,
          role: token.role,
          organizationId: token.organizationId ?? null,
        },
        signoptions,
      );
      return accessToken;
    }
    return null;
  }
}
