import { Inject, Injectable } from '@nestjs/common';
import {
  isLocale,
  type AuditLogDto,
  type ListAuditLogsQuery,
  type ListPlatformSchoolsQuery,
  type ListPlatformUsersQuery,
  type PlatformOverviewDto,
  type PlatformSchoolDto,
  type PlatformUserDto,
  type UpdateSchoolStatusInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import { decodeCursor, encodeCursor } from '../../common/http/cursor.js';
import { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import type { Prisma } from '../../infrastructure/database/prisma.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { AuditService } from '../audit/audit.service.js';
import { schoolUrl } from '../tenancy/school-urls.js';

/**
 * Platform-level reads across every school. This is the only feature module that may
 * read tenant data without a tenant context; every route here requires a platform
 * permission on the platform host.
 */
@Injectable()
export class PlatformService {
  constructor(
    private readonly system: SystemDatabase,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async overview(): Promise<PlatformOverviewDto> {
    const db = this.system.client;
    const [byStatus, users] = await Promise.all([
      db.school.groupBy({ by: ['status'], _count: { _all: true } }),
      db.user.count(),
    ]);
    const count = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
    return {
      schools: {
        total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
        active: count('active'),
        suspended: count('suspended'),
      },
      users: { total: users },
    };
  }

  /** Newest first, keyset-paginated on the time-ordered UUIDv7 id. */
  async listSchools(query: ListPlatformSchoolsQuery): Promise<Page<PlatformSchoolDto>> {
    const after = query.cursor ? decodeCursor(query.cursor, ['id']) : null;
    const where: Prisma.SchoolWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { slug: { contains: query.q.toLowerCase() } },
            ],
          }
        : {}),
      ...(after ? { id: { lt: after.id } } : {}),
    };
    const rows = await this.system.client.school.findMany({
      where,
      orderBy: { id: 'desc' },
      take: query.limit + 1,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        countryCode: true,
        createdAt: true,
        _count: { select: { memberships: { where: { status: 'active' } } } },
      },
    });
    return Page.fromOverfetch(
      rows,
      query.limit,
      (school) => ({
        id: school.id,
        slug: school.slug,
        name: school.name,
        status: school.status,
        url: schoolUrl(this.config, school.slug),
        countryCode: school.countryCode.trim(),
        memberCount: school._count.memberships,
        createdAt: school.createdAt.toISOString(),
      }),
      (school) => encodeCursor({ id: school.id }),
    );
  }

  /** Suspends, reactivates, or archives a school from the platform console. */
  async updateSchoolStatus(
    schoolId: string,
    input: UpdateSchoolStatusInput,
    meta: RequestMeta,
  ): Promise<PlatformSchoolDto> {
    const existing = await this.system.client.school.findUnique({
      where: { id: schoolId },
      select: { id: true, status: true, slug: true, name: true, countryCode: true, createdAt: true },
    });
    if (!existing) {
      throw AppError.notFound('SCHOOL_NOT_FOUND', 'School not found');
    }

    const updated = await this.system.client.school.update({
      where: { id: schoolId },
      data: { status: input.status },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        countryCode: true,
        createdAt: true,
        _count: { select: { memberships: { where: { status: 'active' } } } },
      },
    });

    await this.audit.recordSystem(
      {
        action: 'platform.school_status_updated',
        entityType: 'school',
        entityId: schoolId,
        before: { status: existing.status },
        after: { status: updated.status },
        schoolId,
      },
      meta,
    );

    return {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      url: schoolUrl(this.config, updated.slug),
      countryCode: updated.countryCode.trim(),
      memberCount: updated._count.memberships,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /** Lists all platform users across all schools. */
  async listUsers(query: ListPlatformUsersQuery): Promise<Page<PlatformUserDto>> {
    const after = query.cursor ? decodeCursor(query.cursor, ['id']) : null;
    const where: Prisma.UserWhereInput = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q.toLowerCase() } },
            ],
          }
        : {}),
      ...(after ? { id: { lt: after.id } } : {}),
    };

    const rows = await this.system.client.user.findMany({
      where,
      orderBy: { id: 'desc' },
      take: query.limit + 1,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        avatarUrl: true,
        locale: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    });

    return Page.fromOverfetch(
      rows,
      query.limit,
      (user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatarUrl: user.avatarUrl,
        locale: isLocale(user.locale) ? user.locale : null,
        emailVerified: user.emailVerifiedAt !== null,
        schoolCount: user._count.memberships,
        createdAt: user.createdAt.toISOString(),
      }),
      (user) => encodeCursor({ id: user.id }),
    );
  }

  /** Platform-wide audit activity. */
  async listAuditLogs(query: ListAuditLogsQuery): Promise<Page<AuditLogDto>> {
    const after = query.cursor ? decodeCursor(query.cursor, ['id']) : null;
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' } } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(after ? { id: { lt: after.id } } : {}),
    };

    const rows = await this.system.client.auditLog.findMany({
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
  }
}
