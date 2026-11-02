import { Inject, Injectable } from '@nestjs/common';
import type { MyMembershipDto } from '@eduflow/types';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import type { AuthContext } from '../auth/auth.types.js';
import { schoolUrl } from '../tenancy/school-urls.js';

@Injectable()
export class MeService {
  constructor(
    private readonly db: AppDatabase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * The signed-in user's active memberships across schools (the school picker).
   * Runs with only the user context, where RLS exposes the user's own memberships and
   * the schools behind them, and nothing else.
   */
  schools(auth: AuthContext): Promise<MyMembershipDto[]> {
    return this.db.withUser(auth.userId, async (tx) => {
      const memberships = await tx.db.schoolMembership.findMany({
        // Must match the schools RLS policy (active memberships only), otherwise the
        // required `school` relation would come back hidden.
        where: { userId: tx.userId, status: 'active', school: { status: 'active' } },
        orderBy: { school: { name: 'asc' } },
        select: {
          id: true,
          status: true,
          school: { select: { id: true, slug: true, name: true, status: true } },
          roles: { select: { role: { select: { id: true, key: true, name: true, schoolId: true } } } },
        },
      });
      return memberships.map((membership) => ({
        membershipId: membership.id,
        status: membership.status,
        school: { ...membership.school, url: schoolUrl(this.config, membership.school.slug) },
        roles: membership.roles.map(({ role }) => ({
          id: role.id,
          key: role.key,
          name: role.name,
          isSystem: role.schoolId === null,
        })),
      }));
    });
  }
}
