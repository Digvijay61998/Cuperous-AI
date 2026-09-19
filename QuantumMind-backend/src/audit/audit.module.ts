import { Global, Module } from '@nestjs/common';
import { AuditProviders } from './audit.provider';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService, ...AuditProviders],
  exports: [AuditService, ...AuditProviders],
})
export class AuditModule {}
