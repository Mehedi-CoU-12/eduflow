import { Injectable } from '@nestjs/common';
import {
  type AdmitStudentInput,
  type GuardianLinkDetailDto,
  type LinkGuardianStudentInput,
  type ListStudentsQuery,
  type SectionRosterDto,
  type StudentProfileDto,
  type TransferStudentsInput,
  type UpdateStudentProfileInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { AuditService } from '../audit/audit.service.js';
import { PasswordService } from '../auth/password.service.js';
import { UserProvisioningService } from '../auth/user-provisioning.service.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

interface StudentRowWithRelations {
  id: string;
  userId: string;
  classId: string;
  sectionId: string;
  admissionNumber: string;
  rollNumber: string | null;
  status: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  class: {
    name: string;
  };
  section: {
    name: string;
  };
}

function toStudentProfileDto(row: StudentRowWithRelations): StudentProfileDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    avatarUrl: row.user.avatarUrl,
    admissionNumber: row.admissionNumber,
    rollNumber: row.rollNumber,
    classId: row.classId,
    className: row.class.name,
    sectionId: row.sectionId,
    sectionName: row.section.name,
    status: row.status,
  };
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly system: SystemDatabase,
    private readonly audit: AuditService,
    private readonly userProvisioning: UserProvisioningService,
    private readonly passwords: PasswordService,
  ) {}

  /**
   * Administrative Admissions Workflow: Admits a new student, generates an admission number,
   * assigns class and section, provisions user credentials and membership, and optionally links a guardian.
   */
  async admitStudent(
    tenant: TenantContext,
    input: AdmitStudentInput,
    meta: RequestMeta,
  ): Promise<StudentProfileDto> {
    return this.db.withTenant(tenant, async (tx) => {
      // 1. Verify Class exists in tenant
      const targetClass = await tx.db.class.findFirst({
        where: { id: input.classId, schoolId: tx.schoolId },
      });
      if (!targetClass) {
        throw AppError.notFound('CLASS_NOT_FOUND', 'The selected class does not exist in this school');
      }

      // 2. Verify Section exists and belongs to the specified class
      const targetSection = await tx.db.section.findFirst({
        where: { id: input.sectionId, classId: input.classId, schoolId: tx.schoolId },
      });
      if (!targetSection) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'The selected section does not exist in this class');
      }

      // 3. Verify Section capacity limit if configured
      if (targetSection.capacity !== null && targetSection.capacity > 0) {
        const currentCount = await tx.db.studentProfile.count({
          where: { sectionId: targetSection.id, schoolId: tx.schoolId, status: 'active' },
        });
        if (currentCount >= targetSection.capacity) {
          throw AppError.conflict(
            'SECTION_CAPACITY_EXCEEDED',
            `Section ${targetSection.name} is full (${currentCount}/${targetSection.capacity} capacity reached)`,
          );
        }
      }

      // 4. Generate or validate admission number
      let admissionNumber = input.admissionNumber?.trim();
      if (!admissionNumber) {
        const totalStudents = await tx.db.studentProfile.count({
          where: { schoolId: tx.schoolId },
        });
        const currentYear = new Date().getFullYear();
        admissionNumber = `ADM-${currentYear}-${String(totalStudents + 1).padStart(4, '0')}`;
      }

      // Check unique admission number within school
      const existingAdm = await tx.db.studentProfile.findFirst({
        where: { admissionNumber, schoolId: tx.schoolId },
      });
      if (existingAdm) {
        throw AppError.conflict(
          'ADMISSION_NUMBER_EXISTS',
          `A student with admission number "${admissionNumber}" already exists in this school`,
        );
      }

      // 5. Provision User identity
      const user = await this.userProvisioning.findOrCreateForInvite({
        email: input.email,
        name: input.name,
      });

      // Update phone if provided
      if (input.phone) {
        await this.system.client.user.update({
          where: { id: user.id },
          data: { phone: input.phone },
        });
      }

      // Set initial password if no credential exists yet
      const existingCred = await this.system.client.userCredential.findUnique({
        where: { userId: user.id },
      });
      if (!existingCred) {
        const rawPassword = input.initialPassword || 'Password123!';
        const passwordHash = await this.passwords.hash(rawPassword);
        await this.system.client.userCredential.create({
          data: { userId: user.id, passwordHash },
        });
      }

      // 6. Ensure active SchoolMembership & student Role
      const studentRole = await tx.db.role.findFirst({
        where: { schoolId: null, key: 'student' },
      });

      const membership = await tx.db.schoolMembership.upsert({
        where: { schoolId_userId: { schoolId: tx.schoolId, userId: user.id } },
        create: { schoolId: tx.schoolId, userId: user.id, status: 'active' },
        update: { status: 'active' },
        select: { id: true },
      });

      if (studentRole) {
        await tx.db.membershipRole.upsert({
          where: {
            membershipId_roleId: {
              membershipId: membership.id,
              roleId: studentRole.id,
            },
          },
          create: {
            membershipId: membership.id,
            roleId: studentRole.id,
            schoolId: tx.schoolId,
          },
          update: {},
        });
      }

      // 7. Check if StudentProfile already exists for this user in this school
      const existingProfile = await tx.db.studentProfile.findUnique({
        where: { userId: user.id },
      });
      if (existingProfile) {
        throw AppError.conflict(
          'MEMBER_EXISTS',
          'This user account already has an active student profile in this school',
        );
      }

      // 8. Create StudentProfile
      const created = await tx.db.studentProfile.create({
        data: {
          schoolId: tx.schoolId,
          userId: user.id,
          classId: input.classId,
          sectionId: input.sectionId,
          admissionNumber,
          rollNumber: input.rollNumber ?? null,
          status: 'active',
        },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });

      // 9. Optional Guardian linking during admission
      if (input.guardianEmail) {
        const guardianUser = await this.userProvisioning.findOrCreateForInvite({
          email: input.guardianEmail,
          name: `${input.name}'s Guardian`,
        });

        // Ensure guardian membership & role
        const guardianRole = await tx.db.role.findFirst({
          where: { schoolId: null, key: 'guardian' },
        });

        const guardianMembership = await tx.db.schoolMembership.upsert({
          where: { schoolId_userId: { schoolId: tx.schoolId, userId: guardianUser.id } },
          create: { schoolId: tx.schoolId, userId: guardianUser.id, status: 'active' },
          update: { status: 'active' },
          select: { id: true },
        });

        if (guardianRole) {
          await tx.db.membershipRole.upsert({
            where: {
              membershipId_roleId: {
                membershipId: guardianMembership.id,
                roleId: guardianRole.id,
              },
            },
            create: {
              membershipId: guardianMembership.id,
              roleId: guardianRole.id,
              schoolId: tx.schoolId,
            },
            update: {},
          });
        }

        // Link student to guardian
        await tx.db.guardianStudent.upsert({
          where: {
            schoolId_guardianUserId_studentId: {
              schoolId: tx.schoolId,
              guardianUserId: guardianUser.id,
              studentId: created.id,
            },
          },
          create: {
            schoolId: tx.schoolId,
            guardianUserId: guardianUser.id,
            studentId: created.id,
            relationship: input.guardianRelationship?.trim() || 'Parent',
            isPrimary: true,
          },
          update: {},
        });
      }

      // 10. Audit log
      await this.audit.record(
        tx,
        {
          action: 'student.admitted',
          entityType: 'student_profile',
          entityId: created.id,
          after: {
            admissionNumber,
            className: created.class.name,
            sectionName: created.section.name,
            name: created.user.name,
            email: created.user.email,
          },
          metadata: { userId: user.id },
        },
        meta,
      );

      return toStudentProfileDto(created);
    });
  }

  /**
   * Lists admitted students with optional class, section, status, and search filters.
   */
}
