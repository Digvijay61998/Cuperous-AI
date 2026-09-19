import { Connection } from 'mongoose';
import { AUDIT_LOG_PROVIDER, DATABASE_PROVIDER } from 'src/constants';
import { AuditLog, AuditLogSchema } from './entities/audit-log.entity';

export const AuditProviders = [
  {
    provide: AUDIT_LOG_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(AuditLog.name, AuditLogSchema),
    inject: [DATABASE_PROVIDER],
  },
];
