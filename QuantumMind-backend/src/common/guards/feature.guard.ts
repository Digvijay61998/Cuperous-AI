import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/constants';
import { EntitlementService } from 'src/billing/entitlement.service';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { FeatureKey } from '../constants/feature-catalog';
import { Role } from '../enums/role.enum';

/**
 * Enforces `@RequiresFeature(...)`: the caller's organization must have the
 * feature enabled in its effective entitlements.
 *
 * Skipped for public routes, for SUPER_ADMIN (org-independent management), and
 * for callers with no organization (transitional). Routes without the decorator
 * are unaffected.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const feature = this.reflector.getAllAndOverride<FeatureKey>(
      REQUIRES_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user || user.role === Role.SUPER_ADMIN || !user.organizationId) {
      return true;
    }

    const enabled = await this.entitlementService.isFeatureEnabled(
      String(user.organizationId),
      feature,
    );
    if (!enabled) {
      throw new ForbiddenException(
        `The '${feature}' feature is not enabled for your organization`,
      );
    }
    return true;
  }
}
