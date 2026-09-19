import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { AUDIT_LOG_PROVIDER } from 'src/constants';
import { AuditLogDocument } from './entities/audit-log.entity';

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_LOG_PROVIDER)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  /** Best-effort: an audit write must never break the operation it records. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.auditModel.create({
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        organizationId: entry.organizationId ?? null,
        metadata: entry.metadata ?? {},
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log '${entry.action}': ${error.message}`);
    }
  }
}
