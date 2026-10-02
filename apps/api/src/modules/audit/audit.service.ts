import { Injectable } from '@nestjs/common';

import type { RequestMeta } from '../../common/http/request-context.js';
import { toJson } from '../../common/utils/json.js';
import type { TenantTx } from '../../infrastructure/database/app-database.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';

export interface AuditEvent {
  /** Dotted past-tense verb: "school.created", "membership.roles_updated". */
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface SystemAuditEvent extends AuditEvent {
  readonly schoolId?: string | null;
  readonly actorUserId?: string | null;
}

/**
 * Append-only audit trail. The table rejects UPDATE, DELETE and TRUNCATE at the
 * database level. Never put secrets (passwords, tokens) into before/after/metadata.
 */
@Injectable()
export class AuditService {
  constructor(private readonly system: SystemDatabase) {}

  /**
   * Records a school event inside the caller's tenant transaction, so the entry commits
   * or rolls back together with the change it describes. RLS pins the entry to the
   * current school and the current user.
   */
  async record(tx: TenantTx, event: AuditEvent, meta: RequestMeta): Promise<void> {
    await tx.db.auditLog.create({
      data: { ...this.fields(event, meta), schoolId: tx.schoolId, actorUserId: tx.userId },
      select: { id: true },
    });
  }

  /** Records a user- or platform-level event (sign-in, password reset) outside a school transaction. */
  async recordSystem(event: SystemAuditEvent, meta: RequestMeta): Promise<void> {
    await this.system.client.auditLog.create({
      data: {
        ...this.fields(event, meta),
        schoolId: event.schoolId ?? null,
        actorUserId: event.actorUserId ?? null,
      },
      select: { id: true },
    });
  }

  private fields(event: AuditEvent, meta: RequestMeta) {
    return {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      before: toJson(event.before),
      after: toJson(event.after),
      metadata: toJson(event.metadata),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    };
  }
}
