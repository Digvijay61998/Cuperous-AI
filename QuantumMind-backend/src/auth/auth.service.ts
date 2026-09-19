import { HttpException, Injectable } from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';
import { TokenService } from 'src/token/token.service';
import { LoginDto } from './dto/login.dto';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly agentService: AgentService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const user = await this.agentService.authenticateAgent(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new HttpException('Invalid credentials', 400);
      }

      // `organizationId` lives on the Agent from Phase 1 onward; read
      // defensively so this compiles/works before and after that field lands.
      const organizationId = (user as any).organizationId ?? null;

      const accessToken = await this.tokenService.sign({
        sub: user._id,
        _id: user._id,
        role: user.role,
        email: user.email,
        organizationId,
      });

      const refreshToken = await this.tokenService.createRefreshToken({
        _id: user._id,
        email: user.email,
        role: user.role,
        organizationId,
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async refreshToken(body: { token: string }): Promise<AuthResponse> {
    try {
      const { token } = body;

      const accessToken = await this.tokenService.refreshAccessToken(token);
      if (!accessToken) throw new HttpException('Invalid refresh token', 400);
      return {
        accessToken,
        refreshToken: token,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
