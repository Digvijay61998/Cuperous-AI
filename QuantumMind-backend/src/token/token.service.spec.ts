import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/role.enum';
import { TokenService } from './token.service';

/**
 * Unit tests for refresh-token hardening (Req 7.1): expiry is enforced and the
 * access token is signed from the Agent's current DB state.
 */
describe('TokenService.refreshAccessToken', () => {
  const jwtService = new JwtService({ secret: 'test-secret' });
  const configService = {
    get: (key: string) =>
      key === 'jwt.signOptions' ? { expiresIn: '1h' } : undefined,
  } as any;

  let tokenDoc: any;
  let agentDoc: any;
  let suspended: boolean;
  let tokenModel: any;
  let agentModel: any;
  let organizationService: any;
  let service: TokenService;

  beforeEach(() => {
    tokenDoc = {
      _id: 't1',
      token: 'refresh_abc',
      userId: 'u1',
      email: 'old@example.com',
      role: Role.ORG_ADMIN,
      organizationId: 'orgOld',
      expiresAt: new Date(Date.now() + 60_000),
    };
    agentDoc = {
      _id: 'u1',
      email: 'new@example.com',
      role: Role.AGENT,
      organizationId: 'orgNew',
      active: true,
    };
    suspended = false;
    tokenModel = {
      findOne: jest.fn(async () => tokenDoc),
      deleteOne: jest.fn(async () => ({ deletedCount: 1 })),
    };
    agentModel = { findById: jest.fn(async () => agentDoc) };
    organizationService = { isUnavailable: jest.fn(async () => suspended) };
    service = new TokenService(
      tokenModel,
      agentModel,
      organizationService,
      jwtService,
      configService,
    );
  });

  it('signs with the CURRENT role and organizationId from the DB', async () => {
    const access = await service.refreshAccessToken('refresh_abc');
    const payload = jwtService.verify(access);
    expect(payload).toMatchObject({
      _id: 'u1',
      email: 'new@example.com',
      role: Role.AGENT,
      organizationId: 'orgNew',
    });
    expect(tokenModel.deleteOne).not.toHaveBeenCalled();
  });

  it('keeps organizationId null for an org-independent SUPER_ADMIN', async () => {
    agentDoc = { ...agentDoc, role: Role.SUPER_ADMIN, organizationId: null };
    const payload = jwtService.verify(
      await service.refreshAccessToken('refresh_abc'),
    );
    expect(payload.organizationId).toBeNull();
    expect(organizationService.isUnavailable).not.toHaveBeenCalled();
  });

  it('rejects and deletes an expired refresh token', async () => {
    tokenDoc.expiresAt = new Date(Date.now() - 1000);
    await expect(service.refreshAccessToken('refresh_abc')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(tokenModel.deleteOne).toHaveBeenCalledWith({ _id: 't1' });
    expect(agentModel.findById).not.toHaveBeenCalled();
  });

  it('rejects an unknown refresh token', async () => {
    tokenModel.findOne.mockResolvedValueOnce(null);
    await expect(service.refreshAccessToken('nope')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects and deletes when the agent no longer exists', async () => {
    agentDoc = null;
    await expect(service.refreshAccessToken('refresh_abc')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(tokenModel.deleteOne).toHaveBeenCalledWith({ _id: 't1' });
  });

  it("rejects when the agent's organization is suspended", async () => {
    suspended = true;
    await expect(service.refreshAccessToken('refresh_abc')).rejects.toThrow(
      'Organization is suspended',
    );
    expect(organizationService.isUnavailable).toHaveBeenCalledWith('orgNew');
  });
});
