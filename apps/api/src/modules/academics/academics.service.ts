import { Injectable } from '@nestjs/common';
import type {
  AcademicYearDto,
  ClassDto,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSectionInput,
  CreateSubjectInput,
  CreateTermInput,
  ListAcademicYearsQuery,
  ListClassesQuery,
  ListSectionsQuery,
  ListSubjectsQuery,
  ListTermsQuery,
  SectionDto,
  SubjectDto,
  TermDto,
  UpdateAcademicYearInput,
  UpdateClassInput,
  UpdateSectionInput,
  UpdateSubjectInput,
  UpdateTermInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors.js';
import { AuditService } from '../audit/audit.service.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

@Injectable()
export class AcademicsService {
  constructor(
    private readonly db: AppDatabase,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Academic Years
  // ---------------------------------------------------------------------------

  listAcademicYears(tenant: TenantContext, query: ListAcademicYearsQuery): Promise<AcademicYearDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.academicYear.findMany({
        where: {
          schoolId: tx.schoolId,
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: { startDate: 'desc' },
        include: {
          _count: { select: { terms: true } },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        termCount: row._count.terms,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    });
  }

  getAcademicYear(tenant: TenantContext, id: string): Promise<AcademicYearDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.academicYear.findFirst({
        where: { id, schoolId: tx.schoolId },
        include: { _count: { select: { terms: true } } },
      });
      if (!row) {
        throw AppError.notFound('ACADEMIC_YEAR_NOT_FOUND', 'Academic year not found');
      }

      return {
        id: row.id,
        name: row.name,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        termCount: row._count.terms,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  createAcademicYear(
    tenant: TenantContext,
    input: CreateAcademicYearInput,
    meta: RequestMeta,
  ): Promise<AcademicYearDto> {
    return this.db.withTenant(tenant, async (tx) => {
      try {
        const created = await tx.db.academicYear.create({
          data: {
            schoolId: tx.schoolId,
            name: input.name,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            status: input.status,
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.academic_year.created', entityType: 'academic_year', entityId: created.id, after: created },
          meta,
        );

        return {
          id: created.id,
          name: created.name,
          startDate: created.startDate.toISOString(),
          endDate: created.endDate.toISOString(),
          status: created.status,
          termCount: 0,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('ACADEMIC_YEAR_EXISTS', 'An academic year with that name already exists');
        }
        throw error;
      }
    });
  }

  updateAcademicYear(
    tenant: TenantContext,
    id: string,
    input: UpdateAcademicYearInput,
    meta: RequestMeta,
  ): Promise<AcademicYearDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.academicYear.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!before) {
        throw AppError.notFound('ACADEMIC_YEAR_NOT_FOUND', 'Academic year not found');
      }

      try {
        const updated = await tx.db.academicYear.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
            ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
            ...(input.status ? { status: input.status } : {}),
          },
          include: { _count: { select: { terms: true } } },
        });

        await this.audit.record(
          tx,
          {
            action: 'academics.academic_year.updated',
            entityType: 'academic_year',
            entityId: id,
            before,
            after: updated,
          },
          meta,
        );

        return {
          id: updated.id,
          name: updated.name,
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate.toISOString(),
          status: updated.status,
          termCount: updated._count.terms,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('ACADEMIC_YEAR_EXISTS', 'An academic year with that name already exists');
        }
        throw error;
      }
    });
  }

  deleteAcademicYear(tenant: TenantContext, id: string, meta: RequestMeta): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.academicYear.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('ACADEMIC_YEAR_NOT_FOUND', 'Academic year not found');
      }

      await tx.db.academicYear.delete({ where: { id } });

      await this.audit.record(
        tx,
        { action: 'academics.academic_year.deleted', entityType: 'academic_year', entityId: id, before: existing },
        meta,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Terms
  // ---------------------------------------------------------------------------

  listTerms(tenant: TenantContext, query: ListTermsQuery): Promise<TermDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.term.findMany({
        where: {
          schoolId: tx.schoolId,
          ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: { startDate: 'asc' },
      });

      return rows.map((row) => ({
        id: row.id,
        academicYearId: row.academicYearId,
        name: row.name,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    });
  }

  getTerm(tenant: TenantContext, id: string): Promise<TermDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.term.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!row) {
        throw AppError.notFound('TERM_NOT_FOUND', 'Term not found');
      }

      return {
        id: row.id,
        academicYearId: row.academicYearId,
        name: row.name,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  createTerm(tenant: TenantContext, input: CreateTermInput, meta: RequestMeta): Promise<TermDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const year = await tx.db.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId: tx.schoolId },
      });
      if (!year) {
        throw AppError.notFound('ACADEMIC_YEAR_NOT_FOUND', 'Academic year not found');
      }

      try {
        const created = await tx.db.term.create({
          data: {
            schoolId: tx.schoolId,
            academicYearId: input.academicYearId,
            name: input.name,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            status: input.status,
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.term.created', entityType: 'term', entityId: created.id, after: created },
          meta,
        );

        return {
          id: created.id,
          academicYearId: created.academicYearId,
          name: created.name,
          startDate: created.startDate.toISOString(),
          endDate: created.endDate.toISOString(),
          status: created.status,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('TERM_EXISTS', 'A term with that name already exists in this academic year');
        }
        throw error;
      }
    });
  }

  updateTerm(tenant: TenantContext, id: string, input: UpdateTermInput, meta: RequestMeta): Promise<TermDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.term.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!before) {
        throw AppError.notFound('TERM_NOT_FOUND', 'Term not found');
      }

      try {
        const updated = await tx.db.term.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
            ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
            ...(input.status ? { status: input.status } : {}),
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.term.updated', entityType: 'term', entityId: id, before, after: updated },
          meta,
        );

        return {
          id: updated.id,
          academicYearId: updated.academicYearId,
          name: updated.name,
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate.toISOString(),
          status: updated.status,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('TERM_EXISTS', 'A term with that name already exists in this academic year');
        }
        throw error;
      }
    });
  }

  deleteTerm(tenant: TenantContext, id: string, meta: RequestMeta): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.term.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('TERM_NOT_FOUND', 'Term not found');
      }

      await tx.db.term.delete({ where: { id } });

      await this.audit.record(
        tx,
        { action: 'academics.term.deleted', entityType: 'term', entityId: id, before: existing },
        meta,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Classes
  // ---------------------------------------------------------------------------

  listClasses(tenant: TenantContext, query: ListClassesQuery): Promise<ClassDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.class.findMany({
        where: {
          schoolId: tx.schoolId,
          ...(query.q
            ? {
                OR: [
                  { name: { contains: query.q, mode: 'insensitive' } },
                  { code: { contains: query.q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { name: 'asc' },
        include: {
          sections: {
            orderBy: { name: 'asc' },
          },
          _count: { select: { sections: true } },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        sectionCount: row._count.sections,
        sections: row.sections.map((s) => ({
          id: s.id,
          classId: s.classId,
          name: s.name,
          capacity: s.capacity,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    });
  }

  getClass(tenant: TenantContext, id: string): Promise<ClassDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.class.findFirst({
        where: { id, schoolId: tx.schoolId },
        include: {
          sections: { orderBy: { name: 'asc' } },
          _count: { select: { sections: true } },
        },
      });
      if (!row) {
        throw AppError.notFound('CLASS_NOT_FOUND', 'Class not found');
      }

      return {
        id: row.id,
        name: row.name,
        code: row.code,
        sectionCount: row._count.sections,
        sections: row.sections.map((s) => ({
          id: s.id,
          classId: s.classId,
          name: s.name,
          capacity: s.capacity,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  createClass(tenant: TenantContext, input: CreateClassInput, meta: RequestMeta): Promise<ClassDto> {
    return this.db.withTenant(tenant, async (tx) => {
      try {
        const created = await tx.db.class.create({
          data: {
            schoolId: tx.schoolId,
            name: input.name,
            code: input.code,
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.class.created', entityType: 'class', entityId: created.id, after: created },
          meta,
        );

        return {
          id: created.id,
          name: created.name,
          code: created.code,
          sectionCount: 0,
          sections: [],
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('CLASS_EXISTS', 'A class with that name already exists');
        }
        if (isUniqueViolation(error, 'code')) {
          throw AppError.conflict('CLASS_EXISTS', 'A class with that code already exists');
        }
        throw error;
      }
    });
  }

  updateClass(tenant: TenantContext, id: string, input: UpdateClassInput, meta: RequestMeta): Promise<ClassDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.class.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!before) {
        throw AppError.notFound('CLASS_NOT_FOUND', 'Class not found');
      }

      try {
        const updated = await tx.db.class.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.code ? { code: input.code } : {}),
          },
          include: {
            sections: { orderBy: { name: 'asc' } },
            _count: { select: { sections: true } },
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.class.updated', entityType: 'class', entityId: id, before, after: updated },
          meta,
        );

        return {
          id: updated.id,
          name: updated.name,
          code: updated.code,
          sectionCount: updated._count.sections,
          sections: updated.sections.map((s) => ({
            id: s.id,
            classId: s.classId,
            name: s.name,
            capacity: s.capacity,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('CLASS_EXISTS', 'A class with that name already exists');
        }
        if (isUniqueViolation(error, 'code')) {
          throw AppError.conflict('CLASS_EXISTS', 'A class with that code already exists');
        }
        throw error;
      }
    });
  }

  deleteClass(tenant: TenantContext, id: string, meta: RequestMeta): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.class.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('CLASS_NOT_FOUND', 'Class not found');
      }

      await tx.db.class.delete({ where: { id } });

      await this.audit.record(
        tx,
        { action: 'academics.class.deleted', entityType: 'class', entityId: id, before: existing },
        meta,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  listSections(tenant: TenantContext, query: ListSectionsQuery): Promise<SectionDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.section.findMany({
        where: {
          schoolId: tx.schoolId,
          ...(query.classId ? { classId: query.classId } : {}),
        },
        orderBy: { name: 'asc' },
      });

      return rows.map((row) => ({
        id: row.id,
        classId: row.classId,
        name: row.name,
        capacity: row.capacity,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    });
  }

  getSection(tenant: TenantContext, id: string): Promise<SectionDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.section.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!row) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'Section not found');
      }

      return {
        id: row.id,
        classId: row.classId,
        name: row.name,
        capacity: row.capacity,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  createSection(tenant: TenantContext, input: CreateSectionInput, meta: RequestMeta): Promise<SectionDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const cls = await tx.db.class.findFirst({
        where: { id: input.classId, schoolId: tx.schoolId },
      });
      if (!cls) {
        throw AppError.notFound('CLASS_NOT_FOUND', 'Class not found');
      }

      try {
        const created = await tx.db.section.create({
          data: {
            schoolId: tx.schoolId,
            classId: input.classId,
            name: input.name,
            capacity: input.capacity,
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.section.created', entityType: 'section', entityId: created.id, after: created },
          meta,
        );

        return {
          id: created.id,
          classId: created.classId,
          name: created.name,
          capacity: created.capacity,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('SECTION_EXISTS', 'A section with that name already exists in this class');
        }
        throw error;
      }
    });
  }

  updateSection(tenant: TenantContext, id: string, input: UpdateSectionInput, meta: RequestMeta): Promise<SectionDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.section.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!before) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'Section not found');
      }

      try {
        const updated = await tx.db.section.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.section.updated', entityType: 'section', entityId: id, before, after: updated },
          meta,
        );

        return {
          id: updated.id,
          classId: updated.classId,
          name: updated.name,
          capacity: updated.capacity,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'name')) {
          throw AppError.conflict('SECTION_EXISTS', 'A section with that name already exists in this class');
        }
        throw error;
      }
    });
  }

  deleteSection(tenant: TenantContext, id: string, meta: RequestMeta): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.section.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('SECTION_NOT_FOUND', 'Section not found');
      }

      await tx.db.section.delete({ where: { id } });

      await this.audit.record(
        tx,
        { action: 'academics.section.deleted', entityType: 'section', entityId: id, before: existing },
        meta,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Subjects
  // ---------------------------------------------------------------------------

  listSubjects(tenant: TenantContext, query: ListSubjectsQuery): Promise<SubjectDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await tx.db.subject.findMany({
        where: {
          schoolId: tx.schoolId,
          ...(query.type ? { type: query.type } : {}),
          ...(query.q
            ? {
                OR: [
                  { name: { contains: query.q, mode: 'insensitive' } },
                  { code: { contains: query.q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { name: 'asc' },
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        type: row.type,
        creditHours: row.creditHours,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    });
  }

  getSubject(tenant: TenantContext, id: string): Promise<SubjectDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await tx.db.subject.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!row) {
        throw AppError.notFound('SUBJECT_NOT_FOUND', 'Subject not found');
      }

      return {
        id: row.id,
        name: row.name,
        code: row.code,
        type: row.type,
        creditHours: row.creditHours,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  createSubject(tenant: TenantContext, input: CreateSubjectInput, meta: RequestMeta): Promise<SubjectDto> {
    return this.db.withTenant(tenant, async (tx) => {
      try {
        const created = await tx.db.subject.create({
          data: {
            schoolId: tx.schoolId,
            name: input.name,
            code: input.code,
            type: input.type,
            creditHours: input.creditHours,
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.subject.created', entityType: 'subject', entityId: created.id, after: created },
          meta,
        );

        return {
          id: created.id,
          name: created.name,
          code: created.code,
          type: created.type,
          creditHours: created.creditHours,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'code')) {
          throw AppError.conflict('SUBJECT_EXISTS', 'A subject with that code already exists');
        }
        throw error;
      }
    });
  }

  updateSubject(tenant: TenantContext, id: string, input: UpdateSubjectInput, meta: RequestMeta): Promise<SubjectDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const before = await tx.db.subject.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!before) {
        throw AppError.notFound('SUBJECT_NOT_FOUND', 'Subject not found');
      }

      try {
        const updated = await tx.db.subject.update({
          where: { id },
          data: {
            ...(input.name ? { name: input.name } : {}),
            ...(input.code ? { code: input.code } : {}),
            ...(input.type ? { type: input.type } : {}),
            ...(input.creditHours !== undefined ? { creditHours: input.creditHours } : {}),
          },
        });

        await this.audit.record(
          tx,
          { action: 'academics.subject.updated', entityType: 'subject', entityId: id, before, after: updated },
          meta,
        );

        return {
          id: updated.id,
          name: updated.name,
          code: updated.code,
          type: updated.type,
          creditHours: updated.creditHours,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error, 'code')) {
          throw AppError.conflict('SUBJECT_EXISTS', 'A subject with that code already exists');
        }
        throw error;
      }
    });
  }

  deleteSubject(tenant: TenantContext, id: string, meta: RequestMeta): Promise<void> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.subject.findFirst({
        where: { id, schoolId: tx.schoolId },
      });
      if (!existing) {
        throw AppError.notFound('SUBJECT_NOT_FOUND', 'Subject not found');
      }

      await tx.db.subject.delete({ where: { id } });

      await this.audit.record(
        tx,
        { action: 'academics.subject.deleted', entityType: 'subject', entityId: id, before: existing },
        meta,
      );
    });
  }
}
