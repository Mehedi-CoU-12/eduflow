import { Injectable } from '@nestjs/common';
import type { AuditLogDto, ListAuditLogsQuery } from '@eduflow/types';

import { decodeCursor, encodeCursor } from '../../common/http/cursor.js';
import { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { toJson } from '../../common/utils/json.js';
import { AppDatabase, type TenantTx } from '../../infrastructure/database/app-database.js';
import type { Prisma } from '../../infrastructure/database/prisma.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

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
  constructor(
    private readonly db: AppDatabase,
    private readonly system: SystemDatabase,
  ) {}

  /** Lists audit log entries for the current school, newest first. */
  async list(tenant: TenantContext, query: ListAuditLogsQuery): Promise<Page<AuditLogDto>> {
    const after = query.cursor ? decodeCursor(query.cursor, ['id']) : null;
    return this.db.withTenant(tenant, async (tx) => {
      const where: Prisma.AuditLogWhereInput = {
        schoolId: tx.schoolId,
        ...(query.action ? { action: { contains: query.action, mode: 'insensitive' } } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(after ? { id: { lt: after.id } } : {}),
      };

      const rows = await tx.db.auditLog.findMany({
        where,
        orderBy: { id: 'desc' },
        take: query.limit + 1,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          before: true,
          after: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
        },
      });

      return Page.fromOverfetch(
        rows,
        query.limit,
        (entry) => ({
          id: entry.id,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          actor: entry.actor,
          before: entry.before,
          after: entry.after,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: entry.createdAt.toISOString(),
        }),
        (entry) => encodeCursor({ id: entry.id }),
      );
    });
  }

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
