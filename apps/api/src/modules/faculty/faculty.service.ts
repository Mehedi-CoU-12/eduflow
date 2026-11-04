import { Injectable } from '@nestjs/common';
import {
  type CreateFacultyAssignmentInput,
  type EligibleTeacherDto,
  type FacultyAssignmentDetailDto,
  type ListFacultyAssignmentsQuery,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { AuditService } from '../audit/audit.service.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

interface AssignmentRowWithRelations {
  id: string;
  teacherUserId: string;
  sectionId: string;
  subjectId: string | null;
  isClassTeacher: boolean;
  createdAt: Date;
  teacherUser: {
    name: string;
    email: string;
  };
  section: {
    name: string;
    classId: string;
    class: {
      name: string;
      code: string;
    };
  };
  subject: {
    name: string;
    code: string;
  } | null;
}

function toFacultyAssignmentDetailDto(row: AssignmentRowWithRelations): FacultyAssignmentDetailDto {
  return {
    id: row.id,
    teacherUserId: row.teacherUserId,
    teacherName: row.teacherUser.name,
    teacherEmail: row.teacherUser.email,
    classId: row.section.classId,
    className: row.section.class.name,
    classCode: row.section.class.code,
    sectionId: row.sectionId,
    sectionName: row.section.name,
    subjectId: row.subjectId,
    subjectName: row.subject?.name ?? null,
    subjectCode: row.subject?.code ?? null,
    isClassTeacher: row.isClassTeacher,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class FacultyService {
  constructor(
    private readonly db: AppDatabase,
    private readonly audit: AuditService,
  ) {}

  /**
   * Lists faculty assignments filtered optionally by teacher, class, section, or subject.
   */
  async listAssignments(
    tenant: TenantContext,
    query: ListFacultyAssignmentsQuery,
  ): Promise<FacultyAssignmentDetailDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const where: Record<string, unknown> = { schoolId: tx.schoolId };

      if (query.teacherUserId) where.teacherUserId = query.teacherUserId;
      if (query.sectionId) where.sectionId = query.sectionId;
      if (query.subjectId) where.subjectId = query.subjectId;
      if (query.classId) where.section = { classId: query.classId };

      const rows = await tx.db.teacherAssignment.findMany({
        where,
        include: {
          teacherUser: { select: { name: true, email: true } },
          section: {
            include: {
              class: { select: { name: true, code: true } },
            },
          },
          subject: { select: { name: true, code: true } },
        },
        orderBy: [
          { section: { class: { name: 'asc' } } },
          { section: { name: 'asc' } },
          { teacherUser: { name: 'asc' } },
        ],
      });

      return rows.map(toFacultyAssignmentDetailDto);
    });
  }

  /**
   * Assigns a teacher to a section and optionally a subject.
   */
  async createAssignment(
    tenant: TenantContext,
    input: CreateFacultyAssignmentInput,
    meta: RequestMeta,
  ): Promise<FacultyAssignmentDetailDto> {
    return this.db.withTenant(tenant, async (tx) => {
      // 1. Verify section exists in school
      const section = await tx.db.section.findFirst({
        where: { id: input.sectionId, schoolId: tx.schoolId },
        include: { class: true },
      });
      if (!section) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'Section not found in this school');
      }

      // 2. If subject provided, verify subject exists in school
      let subjectName: string | null = null;
      if (input.subjectId) {
        const subject = await tx.db.subject.findFirst({
          where: { id: input.subjectId, schoolId: tx.schoolId },
        });
        if (!subject) {
          throw AppError.notFound('SUBJECT_NOT_FOUND', 'Subject not found in this school');
        }
        subjectName = subject.name;
      }

      // 3. Verify user is an active member of the school with the teacher role
      const teacherMembership = await tx.db.schoolMembership.findFirst({
        where: {
          userId: input.teacherUserId,
          schoolId: tx.schoolId,
          status: 'active',
          roles: {
            some: {
              role: {
                key: 'teacher',
              },
            },
          },
        },
        include: { user: { select: { name: true, email: true } } },
      });

      if (!teacherMembership) {
        throw AppError.notFound(
          'MEMBER_NOT_FOUND',
          'The specified user is not an active teacher in this school',
        );
      }

      // 4. Check for duplicate assignment
      const existing = await tx.db.teacherAssignment.findFirst({
        where: {
          schoolId: tx.schoolId,
          teacherUserId: input.teacherUserId,
          sectionId: input.sectionId,
          subjectId: input.subjectId ?? null,
        },
      });

      if (existing) {
        throw AppError.conflict(
          'TEACHER_ASSIGNMENT_EXISTS',
          'This teacher is already assigned to this section and subject',
        );
      }

      // 5. Create assignment
      const created = await tx.db.teacherAssignment.create({
        data: {
          schoolId: tx.schoolId,
          teacherUserId: input.teacherUserId,
          sectionId: input.sectionId,
          subjectId: input.subjectId ?? null,
          isClassTeacher: input.isClassTeacher ?? false,
        },
        include: {
          teacherUser: { select: { name: true, email: true } },
          section: {
            include: {
              class: { select: { name: true, code: true } },
            },
          },
          subject: { select: { name: true, code: true } },
        },
      });

      // 6. Audit log
      await this.audit.record(
        tx,
        {
          action: 'faculty.assigned',
          entityType: 'teacher_assignment',
          entityId: created.id,
          after: {
            teacher: teacherMembership.user.name,
            class: section.class.name,
            section: section.name,
            subject: subjectName,
            isClassTeacher: input.isClassTeacher,
          },
          metadata: { teacherUserId: input.teacherUserId },
        },
        meta,
      );

      return toFacultyAssignmentDetailDto(created);
    });
  }

  /**
   * Removes a faculty assignment.
   */
}
