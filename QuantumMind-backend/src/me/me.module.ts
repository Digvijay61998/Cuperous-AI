import { Module } from '@nestjs/common';
import { MeController } from './me.controller';

/**
 * Exposes GET /me/entitlements. EntitlementService and OrganizationService come
 * from their @Global modules, so no imports are needed here.
 */
@Module({
  controllers: [MeController],
})
export class MeModule {}
