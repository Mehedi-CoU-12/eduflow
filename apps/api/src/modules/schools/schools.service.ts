import { Inject, Injectable } from '@nestjs/common';
import type { CreateSchoolInput, SchoolDto, UpdateSchoolInput } from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { uuidv7 } from '../../common/utils/uuid.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import { SessionService } from '../auth/session.service.js';
import { HostResolverService } from '../tenancy/host-resolver.service.js';
import { SCHOOL_SELECT, toSchoolDto } from '../tenancy/tenancy.mappers.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import type { HostContext } from '../tenancy/tenancy.types.js';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly hosts: HostResolverService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Onboarding step 1: creates a school and makes the caller its School Owner.
   *
   * The new school's id is generated here, and the RLS context is set to it before the
   * insert, so even school creation runs under row level security as the app role.
   * School, membership, role assignment and audit entry commit together.
   */
  async create(auth: AuthContext, host: HostContext, input: CreateSchoolInput, meta: RequestMeta): Promise<SchoolDto> {
    if (host.kind !== 'root') {
      throw AppError.forbidden('PERMISSION_DENIED', 'Schools are created from the account host');
    }

    const schoolId = uuidv7();
    const school = await this.db.withTenant({ schoolId, userId: auth.userId }, async (tx) => {
      const ownerRole = await tx.db.role.findUnique({ where: { key: 'school_owner' }, select: { id: true } });
      if (!ownerRole) throw new Error('System role "school_owner" is missing; run the access-control sync');

      let created;
      try {
        created = await tx.db.school.create({
          data: { id: schoolId, ...input, onboardingStatus: 'in_progress' },
          select: SCHOOL_SELECT,
        });
      } catch (error) {
        if (isUniqueViolation(error, 'slug')) {
          throw AppError.conflict('SLUG_TAKEN', 'That school address is already taken');
        }
        throw error;
      }

      const membership = await tx.db.schoolMembership.create({
        data: { schoolId, userId: auth.userId, status: 'active' },
        select: { id: true },
      });
      await tx.db.membershipRole.create({
        data: { membershipId: membership.id, roleId: ownerRole.id, schoolId },
        select: { roleId: true },
      });
      await this.audit.record(
        tx,
        { action: 'school.created', entityType: 'school', entityId: schoolId, after: created },
        meta,
      );
      return created;
    });

    this.hosts.invalidate();
    await this.sessions.setActiveSchool(auth.sessionId, schoolId);
    return toSchoolDto(this.config, school);
  }

  current(tenant: TenantContext): Promise<SchoolDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const school = await tx.db.school.findUniqueOrThrow({ where: { id: tx.schoolId }, select: SCHOOL_SELECT });
      return toSchoolDto(this.config, school);
    });
  }

  /** Updates the school profile and settings. */
  update(tenant: TenantContext, input: UpdateSchoolInput, meta: RequestMeta): Promise<SchoolDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.school.findUniqueOrThrow({ where: { id: tx.schoolId }, select: SCHOOL_SELECT });
      const updated = await tx.db.school.update({
        where: { id: tx.schoolId },
        data: input,
        select: SCHOOL_SELECT,
      });

      await this.audit.record(
        tx,
        { action: 'school.updated', entityType: 'school', entityId: tx.schoolId, before, after: updated },
        meta,
      );

      this.hosts.invalidate();
      return toSchoolDto(this.config, updated);
    });
  }
}
