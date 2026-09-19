import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Role } from 'src/common/enums/role.enum';

export interface JwtPayload {
  email: string;
  role: Role;
  _id: string;
  /** Tenant the user belongs to. `null` for SUPER_ADMIN (org-independent). */
  organizationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      _id: payload._id,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId ?? null,
    };
  }
}
