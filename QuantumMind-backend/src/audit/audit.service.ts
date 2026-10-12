import { Inject, Injectable, Logger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
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

/** Keys that must never be persisted in audit metadata. */
const SECRET_KEYS = /pass(word)?|token|secret|accesstoken/i;

function redact(value: any, depth = 0): any {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_KEYS.test(k) ? '[redacted]' : redact(v, depth + 1);
  }
  return out;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_LOG_PROVIDER)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Best-effort: an audit write must never break the operation it records.
   * Secret-looking metadata keys are redacted before persisting.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.auditModel.create({
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        organizationId: entry.organizationId ?? null,
        metadata: redact(entry.metadata ?? {}),
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log '${entry.action}': ${error.message}`);
    }
  }

  /** Paged audit trail, newest first (super-admin console). */
  async list(query: {
    organizationId?: string;
    action?: string;
    skip?: number;
    limit?: number;
  }) {
    const filter: Record<string, any> = {};
    if (query.organizationId && mongoose.isValidObjectId(query.organizationId)) {
      filter.organizationId = query.organizationId;
    }
    if (query.action) filter.action = String(query.action);
    const skip = Math.max(0, Number(query.skip) || 0);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const [data, count] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditModel.countDocuments(filter),
    ]);
    return { data, count };
  }
}
