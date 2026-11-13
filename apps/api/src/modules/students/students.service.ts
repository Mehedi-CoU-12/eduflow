import { Inject, Injectable } from '@nestjs/common';
import type {
  AdmitStudentInput,
  GuardianLinkDetailDto,
  LinkGuardianStudentInput,
  ListStudentsQuery,
  SectionRosterDto,
  StudentProfileDto,
  TransferStudentsInput,
  UpdateStudentProfileInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { MailService } from '../../infrastructure/mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthTokenService } from '../auth/auth-token.service.js';
import { PasswordService } from '../auth/password.service.js';
import { UserProvisioningService } from '../auth/user-provisioning.service.js';
import { schoolUrl } from '../tenancy/school-urls.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StudentRowWithRelations {
  id: string;
  userId: string;
  classId: string;
  sectionId: string;
  admissionNumber: string;
  rollNumber: string | null;
  status: string;
  createdAt?: Date;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl: string | null;
    emailVerifiedAt?: Date | null;
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
    phone: row.user.phone,
    avatarUrl: row.user.avatarUrl,
    admissionNumber: row.admissionNumber,
    rollNumber: row.rollNumber,
    classId: row.classId,
    className: row.class.name,
    sectionId: row.sectionId,
    sectionName: row.section.name,
    status: row.status,
    emailVerified: Boolean(row.user.emailVerifiedAt),
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
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
    private readonly mail: MailService,
    private readonly tokens: AuthTokenService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
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
    const result = await this.db.withTenant(tenant, async (tx) => {
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

      // Check current verification status
      const existingUser = await this.system.client.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, locale: true, emailVerifiedAt: true },
      });
      let isVerified = Boolean(existingUser?.emailVerifiedAt);

      if (input.verifyEmailImmediately && !isVerified) {
        await this.system.client.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
        isVerified = true;
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
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });

      // 9. Optional Guardian linking during admission
      let guardianInviteInfo: { email: string; name: string; locale: string | null; hasCredential: boolean; id: string } | null = null;
      if (input.guardianEmail) {
        const guardianUser = await this.userProvisioning.findOrCreateForInvite({
          email: input.guardianEmail,
          name: `${input.name}'s Guardian`,
        });

        guardianInviteInfo = {
          id: guardianUser.id,
          email: guardianUser.email,
          name: guardianUser.name,
          locale: guardianUser.locale,
          hasCredential: guardianUser.hasCredential,
        };

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

      return {
        profile: toStudentProfileDto(created),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          locale: user.locale,
        },
        isVerified,
        guardianInviteInfo,
      };
    });

    // Send email to student
    if (!result.isVerified) {
      const token = await this.tokens.issue(result.user.id, 'email_verification', EMAIL_VERIFICATION_TTL_MS);
      const verifyUrl = `${schoolUrl(this.config, tenant.school.slug)}/verify-email?token=${token}`;
      await this.mail.send({
        to: result.user.email,
        template: 'verifyEmail',
        locale: result.user.locale ?? tenant.school.defaultLocale,
        name: result.user.name,
        url: verifyUrl,
      });
    } else {
      const portalUrl = schoolUrl(this.config, tenant.school.slug);
      await this.mail.send({
        to: result.user.email,
        template: 'schoolInvite',
        locale: result.user.locale ?? tenant.school.defaultLocale,
        name: result.user.name,
        url: portalUrl,
      });
    }

    // Optional guardian notification
    if (result.guardianInviteInfo) {
      if (!result.guardianInviteInfo.hasCredential) {
        const token = await this.tokens.issue(result.guardianInviteInfo.id, 'password_reset', INVITE_TOKEN_TTL_MS);
        const inviteUrl = `${schoolUrl(this.config, tenant.school.slug)}/reset-password?token=${token}&mode=invite`;
        await this.mail.send({
          to: result.guardianInviteInfo.email,
          template: 'schoolInviteNewUser',
          locale: result.guardianInviteInfo.locale ?? tenant.school.defaultLocale,
          name: result.guardianInviteInfo.name,
          url: inviteUrl,
        });
      } else {
        await this.mail.send({
          to: result.guardianInviteInfo.email,
          template: 'schoolInvite',
          locale: result.guardianInviteInfo.locale ?? tenant.school.defaultLocale,
          name: result.guardianInviteInfo.name,
          url: schoolUrl(this.config, tenant.school.slug),
        });
      }
    }

    return result.profile;
  }

  /**
   * Lists admitted students with optional class, section, status, and search filters.
   */
  async listStudents(tenant: TenantContext, query: ListStudentsQuery): Promise<StudentProfileDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const where: Record<string, unknown> = { schoolId: tx.schoolId };

      if (query.classId) where.classId = query.classId;
      if (query.sectionId) where.sectionId = query.sectionId;
      if (query.status) where.status = query.status;

      if (query.q) {
        where.OR = [
          { user: { name: { contains: query.q, mode: 'insensitive' } } },
          { user: { email: { contains: query.q, mode: 'insensitive' } } },
          { admissionNumber: { contains: query.q, mode: 'insensitive' } },
          { rollNumber: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      const rows = await tx.db.studentProfile.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: [
          { class: { name: 'asc' } },
          { section: { name: 'asc' } },
          { rollNumber: 'asc' },
          { admissionNumber: 'asc' },
        ],
        take: query.limit || 50,
      });

      return rows.map(toStudentProfileDto);
    });
  }

  /**
   * Retrieves single student profile with enrolled class, section, and linked guardians.
   */
  async getStudent(tenant: TenantContext, studentId: string): Promise<StudentProfileDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.studentProfile.findFirst({
        where: { id: studentId, schoolId: tx.schoolId },
        include: {
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });

      if (!row) {
        throw AppError.notFound('STUDENT_NOT_FOUND', 'Student record not found in this school');
      }

      return toStudentProfileDto(row);
    });
  }

  /**
   * Updates student details (e.g. roll number or status).
   */
  async updateStudent(
    tenant: TenantContext,
    studentId: string,
    input: UpdateStudentProfileInput,
    meta: RequestMeta,
  ): Promise<StudentProfileDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.studentProfile.findFirst({
        where: { id: studentId, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('STUDENT_NOT_FOUND', 'Student record not found in this school');
      }

      const updated = await tx.db.studentProfile.update({
        where: { id: studentId },
        data: {
          ...(input.rollNumber !== undefined ? { rollNumber: input.rollNumber } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });

      await this.audit.record(
        tx,
        {
          action: 'student.updated',
          entityType: 'student_profile',
          entityId: studentId,
          before: existing,
          after: updated,
        },
        meta,
      );

      return toStudentProfileDto(updated);
    });
  }

  /**
   * Manually marks a student's user email as verified (by school owner or admin).
   */
  async verifyStudentEmail(
    tenant: TenantContext,
    studentId: string,
    meta: RequestMeta,
  ): Promise<StudentProfileDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const student = await tx.db.studentProfile.findFirst({
        where: { id: studentId, schoolId: tx.schoolId },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });
      if (!student) {
        throw AppError.notFound('STUDENT_NOT_FOUND', 'Student record not found in this school');
      }

      if (!student.user.emailVerifiedAt) {
        await this.system.client.user.update({
          where: { id: student.userId },
          data: { emailVerifiedAt: new Date() },
        });

        await this.audit.record(
          tx,
          {
            action: 'student.email_verified_manually',
            entityType: 'student_profile',
            entityId: student.id,
            after: { email: student.user.email, emailVerified: true },
            metadata: { userId: student.userId },
          },
          meta,
        );
      }

      const updated = await tx.db.studentProfile.findFirst({
        where: { id: studentId, schoolId: tx.schoolId },
        include: {
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });
      if (!updated) throw AppError.notFound('STUDENT_NOT_FOUND', 'Student record not found in this school');
      return toStudentProfileDto(updated);
    });
  }

  /**
   * Section Rostering: Retrieves section roster with capacity metrics and enrolled students.
   */
  async getSectionRoster(tenant: TenantContext, sectionId: string): Promise<SectionRosterDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const section = await tx.db.section.findFirst({
        where: { id: sectionId, schoolId: tx.schoolId },
        include: { class: true },
      });

      if (!section) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'Section not found in this school');
      }

      const students = await tx.db.studentProfile.findMany({
        where: { sectionId, schoolId: tx.schoolId, status: 'active' },
        include: {
          user: { select: { name: true, email: true, phone: true, avatarUrl: true, emailVerifiedAt: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: [{ rollNumber: 'asc' }, { admissionNumber: 'asc' }],
      });

      return {
        section: {
          sectionId: section.id,
          sectionName: section.name,
          classId: section.classId,
          className: section.class.name,
          classCode: section.class.code,
          capacity: section.capacity,
          enrolledCount: students.length,
        },
        students: students.map(toStudentProfileDto),
      };
    });
  }

  /**
   * Section Rostering: Reassigns / transfers students between sections and classes.
   */
  async transferStudents(
    tenant: TenantContext,
    input: TransferStudentsInput,
    meta: RequestMeta,
  ): Promise<{ transferredCount: number }> {
    return this.db.withTenant(tenant, async (tx) => {
      // Verify target section and class
      const targetSection = await tx.db.section.findFirst({
        where: { id: input.targetSectionId, classId: input.targetClassId, schoolId: tx.schoolId },
        include: { class: true },
      });

      if (!targetSection) {
        throw AppError.notFound(
          'SECTION_NOT_FOUND',
          'Target section does not exist in the specified class',
        );
      }

      // Check capacity limit if configured
      if (targetSection.capacity !== null && targetSection.capacity > 0) {
        const currentCount = await tx.db.studentProfile.count({
          where: { sectionId: targetSection.id, schoolId: tx.schoolId, status: 'active' },
        });

        if (currentCount + input.studentIds.length > targetSection.capacity) {
          throw AppError.conflict(
            'SECTION_CAPACITY_EXCEEDED',
            `Target section ${targetSection.name} cannot accommodate ${input.studentIds.length} students (current: ${currentCount}/${targetSection.capacity})`,
          );
        }
      }

      // Perform transfer
      const updateResult = await tx.db.studentProfile.updateMany({
        where: {
          id: { in: input.studentIds },
          schoolId: tx.schoolId,
        },
        data: {
          classId: input.targetClassId,
          sectionId: input.targetSectionId,
        },
      });

      await this.audit.record(
        tx,
        {
          action: 'student.rostered',
          entityType: 'student_profile',
          entityId: input.targetSectionId,
          after: {
            targetClass: targetSection.class.name,
            targetSection: targetSection.name,
            transferredStudents: input.studentIds,
          },
          metadata: { count: updateResult.count },
        },
        meta,
      );

      return { transferredCount: updateResult.count };
    });
  }

  // ---------------------------------------------------------------------------
  // Guardian Relationship Linking
  // ---------------------------------------------------------------------------

  /**
   * Lists all students linked to a guardian user.
   */
  async listGuardianStudents(
    tenant: TenantContext,
    guardianUserId: string,
  ): Promise<GuardianLinkDetailDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.guardianStudent.findMany({
        where: { guardianUserId, schoolId: tx.schoolId },
        include: {
          guardianUser: { select: { id: true, name: true, email: true } },
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { student: { admissionNumber: 'asc' } }],
      });

      return rows.map((r) => ({
        id: r.id,
        guardianUserId: r.guardianUserId,
        guardianName: r.guardianUser.name,
        guardianEmail: r.guardianUser.email,
        studentId: r.studentId,
        studentName: r.student.user.name,
        studentAdmissionNumber: r.student.admissionNumber,
        studentRollNumber: r.student.rollNumber,
        className: r.student.class.name,
        sectionName: r.student.section.name,
        relationship: r.relationship,
        isPrimary: r.isPrimary,
        createdAt: r.createdAt.toISOString(),
      }));
    });
  }

  /**
   * Links a student to a guardian user.
   */
  async linkGuardianStudent(
    tenant: TenantContext,
    guardianUserId: string,
    input: LinkGuardianStudentInput,
    meta: RequestMeta,
  ): Promise<GuardianLinkDetailDto> {
    return this.db.withTenant(tenant, async (tx) => {
      // 1. Verify student exists in school
      const student = await tx.db.studentProfile.findFirst({
        where: { id: input.studentId, schoolId: tx.schoolId },
        include: {
          user: { select: { name: true, email: true } },
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
      });

      if (!student) {
        throw AppError.notFound('STUDENT_NOT_FOUND', 'Student record not found in this school');
      }

      // 2. Verify guardian user exists and is a member of this school
      const guardianMember = await tx.db.schoolMembership.findFirst({
        where: { userId: guardianUserId, schoolId: tx.schoolId, status: 'active' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!guardianMember) {
        throw AppError.notFound('MEMBER_NOT_FOUND', 'Guardian is not an active member of this school');
      }

      // 3. Check existing link
      const existing = await tx.db.guardianStudent.findUnique({
        where: {
          schoolId_guardianUserId_studentId: {
            schoolId: tx.schoolId,
            guardianUserId,
            studentId: input.studentId,
          },
        },
      });

      if (existing) {
        throw AppError.conflict(
          'GUARDIAN_LINK_EXISTS',
          'This guardian is already linked to this student',
        );
      }

      // 4. Create link
      const created = await tx.db.guardianStudent.create({
        data: {
          schoolId: tx.schoolId,
          guardianUserId,
          studentId: input.studentId,
          relationship: input.relationship,
          isPrimary: input.isPrimary,
        },
        include: {
          guardianUser: { select: { id: true, name: true, email: true } },
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
        },
      });

      await this.audit.record(
        tx,
        {
          action: 'guardian.linked',
          entityType: 'guardian_student',
          entityId: created.id,
          after: {
            guardian: guardianMember.user.name,
            student: student.user.name,
            relationship: input.relationship,
          },
        },
        meta,
      );

      return {
        id: created.id,
        guardianUserId: created.guardianUserId,
        guardianName: created.guardianUser.name,
        guardianEmail: created.guardianUser.email,
        studentId: created.studentId,
        studentName: created.student.user.name,
        studentAdmissionNumber: created.student.admissionNumber,
        studentRollNumber: created.student.rollNumber,
        className: created.student.class.name,
        sectionName: created.student.section.name,
        relationship: created.relationship,
        isPrimary: created.isPrimary,
        createdAt: created.createdAt.toISOString(),
      };
    });
  }

  /**
   * Unlinks a student from a guardian user.
   */
  async unlinkGuardianStudent(
    tenant: TenantContext,
    guardianUserId: string,
    studentId: string,
    meta: RequestMeta,
  ): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const link = await tx.db.guardianStudent.findUnique({
        where: {
          schoolId_guardianUserId_studentId: {
            schoolId: tx.schoolId,
            guardianUserId,
            studentId,
          },
        },
      });

      if (!link) {
        throw AppError.notFound('GUARDIAN_LINK_NOT_FOUND', 'Guardian relationship link not found');
      }

      await tx.db.guardianStudent.delete({
        where: { id: link.id },
      });

      await this.audit.record(
        tx,
        {
          action: 'guardian.unlinked',
          entityType: 'guardian_student',
          entityId: link.id,
          metadata: { guardianUserId, studentId },
        },
        meta,
      );
    });
  }

  /**
   * Lists all guardians linked to a specific student.
   */
  async listStudentGuardians(
    tenant: TenantContext,
    studentId: string,
  ): Promise<GuardianLinkDetailDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.guardianStudent.findMany({
        where: { studentId, schoolId: tx.schoolId },
        include: {
          guardianUser: { select: { id: true, name: true, email: true } },
          student: {
            include: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }],
      });

      return rows.map((r) => ({
        id: r.id,
        guardianUserId: r.guardianUserId,
        guardianName: r.guardianUser.name,
        guardianEmail: r.guardianUser.email,
        studentId: r.studentId,
        studentName: r.student.user.name,
        studentAdmissionNumber: r.student.admissionNumber,
        studentRollNumber: r.student.rollNumber,
        className: r.student.class.name,
        sectionName: r.student.section.name,
        relationship: r.relationship,
        isPrimary: r.isPrimary,
        createdAt: r.createdAt.toISOString(),
      }));
    });
  }
}
