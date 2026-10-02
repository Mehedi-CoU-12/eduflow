import { Inject, Injectable } from '@nestjs/common';
import type { ListPlatformSchoolsQuery, PlatformOverviewDto, PlatformSchoolDto } from '@shikkhacore/types';

import { decodeCursor, encodeCursor } from '../../common/http/cursor.js';
import { Page } from '../../common/http/page.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import type { Prisma } from '../../infrastructure/database/prisma.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
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
}
