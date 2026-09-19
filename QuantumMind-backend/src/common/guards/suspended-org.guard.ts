import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/constants';
import { OrganizationService } from 'src/organization/organization.service';
import { Role } from '../enums/role.enum';

/**
 * Denies every request from a user whose organization is suspended, so a
 * SUPER_ADMIN can cut off a customer immediately without waiting for tokens to
 * expire. Runs after JwtAuthGuard/RolesGuard, so `request.user` is populated.
 *
 * Skipped for public routes, for SUPER_ADMIN (org-independent), and for users
 * with no organization yet. Performs a lean, status-only lookup.
 */
@Injectable()
export class SuspendedOrgGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizationService: OrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === Role.SUPER_ADMIN || !user.organizationId) {
      return true;
    }

    if (await this.organizationService.isSuspended(String(user.organizationId))) {
      throw new ForbiddenException('Your organization has been suspended');
    }
    return true;
  }
}
