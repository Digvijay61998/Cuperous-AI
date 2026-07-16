import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthResponse, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './Public/public.decorator';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.validateUser(loginDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { token: string }): Promise<AuthResponse> {
    return await this.authService.refreshToken(body);
  }
}
