import { Global, Module } from '@nestjs/common';
import { OrganizationProviders } from './organization.provider';
import { OrganizationService } from './organization.service';
import { OrganizationAdminService } from './organization-admin.service';
import { OrganizationController } from './organization.controller';
import { AdminController } from './admin.controller';

/**
 * Global so the tenant guards and entitlement service can inject the
 * Organization model/service anywhere. Hosts the super-admin console endpoints
 * (org CRUD, subscriptions, impersonation, global overview) via the
 * OrganizationAdminService orchestrator.
 */
@Global()
@Module({
  controllers: [OrganizationController, AdminController],
  providers: [
    OrganizationService,
    OrganizationAdminService,
    ...OrganizationProviders,
  ],
  exports: [OrganizationService, ...OrganizationProviders],
})
export class OrganizationModule {}
