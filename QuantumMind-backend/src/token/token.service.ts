import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AGENT_PROVIDER, TOKEN_PROVIDER } from 'src/constants';
import { Model } from 'mongoose';
import { TokenDocument } from './entities/token.entity';
import { generateId } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { AgentDocument } from 'src/agent/entities/agent.entity';
import { OrganizationService } from 'src/organization/organization.service';

@Injectable()
export class TokenService {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenModel: Model<TokenDocument>,
    // Injected as the raw model (not AgentService) to avoid a dependency cycle:
    // AgentService -> EntitlementService -> ... and OrganizationAdminService
    // already depends on both TokenService and AgentService.
    @Inject(AGENT_PROVIDER) private readonly agentModel: Model<AgentDocument>,
    private readonly organizationService: OrganizationService,
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

  /**
   * Exchanges a refresh token for a new access token.
   *
   * The access token is signed from the Agent's CURRENT state in the DB, not
   * the role/org snapshot stored on the refresh token, so demotions and org
   * moves take effect on the next refresh. Rejects (401) when the token is
   * unknown or expired, the agent no longer exists / is deactivated, or the
   * agent's organization is suspended. Expired or orphaned tokens are deleted.
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const token = await this.tokenModel.findOne({ token: refreshToken });
    if (!token) throw new UnauthorizedException('Invalid refresh token');

    if (!token.expiresAt || new Date(token.expiresAt).getTime() <= Date.now()) {
      await this.tokenModel.deleteOne({ _id: token._id });
      throw new UnauthorizedException('Refresh token expired');
    }

    const agent = await this.agentModel.findById(token.userId);
    if (!agent || agent.active === false) {
      await this.tokenModel.deleteOne({ _id: token._id });
      throw new UnauthorizedException('User no longer exists');
    }

    const organizationId = agent.organizationId
      ? String(agent.organizationId)
      : null;

    if (
      organizationId &&
      (await this.organizationService.isUnavailable(organizationId))
    ) {
      throw new UnauthorizedException('Organization is suspended');
    }
    // A non-super-admin must always belong to an org.
    if (!organizationId && agent.role !== 'super_admin') {
      await this.tokenModel.deleteOne({ _id: token._id });
      throw new UnauthorizedException('User is not associated with an organization');
    }

    const signoptions = this.configService.get('jwt.signOptions');
    return this.sign(
      {
        sub: String(agent._id),
        _id: String(agent._id),
        email: agent.email,
        role: agent.role,
        organizationId,
      },
      signoptions,
    );
  }
}
