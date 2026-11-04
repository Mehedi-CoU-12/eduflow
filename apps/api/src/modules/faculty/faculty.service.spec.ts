import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { FacultyService } from './faculty.service.js';
import type { AppDatabase, TenantTx } from '../../infrastructure/database/app-database.js';
import type { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';

interface MockPrismaModel {
  findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  findFirst: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  create: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  delete: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  groupBy?: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
}

interface MockPrismaClient {
  teacherAssignment: MockPrismaModel;
  schoolMembership: MockPrismaModel;
  section: MockPrismaModel;
  subject: MockPrismaModel;
}

interface FakeTransaction {
  schoolId: string;
  userId: string;
  db: MockPrismaClient;
}

describe('FacultyService', () => {
  let service: FacultyService;
  let fakeTx: FakeTransaction;
  let mockDb: AppDatabase;
  let mockAudit: AuditService;

  const fakeTenant = {
    schoolId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
    userId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6d',
    membershipId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6c',
    school: { id: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b' },
    roles: [{ id: 'role-admin', key: 'school_admin', name: 'School Admin' }],
    permissions: { has: () => true, covers: () => true, hasAll: () => true },
  } as unknown as TenantContext;

  const fakeMeta: RequestMeta = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    requestId: 'req-123',
  };

  const createMockModel = (): MockPrismaModel => ({
    findMany: jest.fn<() => Promise<unknown>>(),
    findFirst: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
    groupBy: jest.fn<() => Promise<unknown>>(),
  });

  beforeEach(() => {
    fakeTx = {
      schoolId: fakeTenant.schoolId,
      userId: fakeTenant.userId,
      db: {
        teacherAssignment: createMockModel(),
        schoolMembership: createMockModel(),
        section: createMockModel(),
        subject: createMockModel(),
      },
    };

    mockDb = {
      withTenant: jest.fn(
        <T>(_tenant: TenantContext, callback: (tx: TenantTx) => Promise<T>): Promise<T> =>
          callback(fakeTx as unknown as TenantTx),
      ),
    } as unknown as AppDatabase;

    mockAudit = {
      record: jest.fn<() => Promise<void>>().mockResolvedValue(),
    } as unknown as AuditService;

    service = new FacultyService(mockDb, mockAudit);
  });

  describe('listAssignments', () => {
    it('returns formatted faculty assignment list', async () => {
      fakeTx.db.teacherAssignment.findMany.mockResolvedValue([
        {
          id: 'asg-1',
          teacherUserId: 't-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          isClassTeacher: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          teacherUser: { name: 'Teacher 1', email: 't1@example.com' },
          section: {
            name: 'Section A',
            classId: 'c-1',
            class: { name: 'Class 8', code: 'C8' },
          },
          subject: { name: 'Mathematics', code: 'MATH' },
        },
      ]);

      const assignments = await service.listAssignments(fakeTenant, {});
      expect(assignments).toHaveLength(1);
      expect(assignments[0]?.teacherName).toBe('Teacher 1');
      expect(assignments[0]?.className).toBe('Class 8');
      expect(assignments[0]?.isClassTeacher).toBe(true);
    });
  });

  describe('createAssignment', () => {
    it('creates a faculty assignment when valid', async () => {
      fakeTx.db.schoolMembership.findFirst.mockResolvedValue({
        id: 'mem-1',
        user: { name: 'Teacher 1', email: 't1@example.com' },
        membershipRoles: [{ role: { key: 'teacher' } }],
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'sec-1',
        name: 'Section A',
        schoolId: fakeTenant.schoolId,
        class: { name: 'Class 8', code: 'C8' },
      });
      fakeTx.db.subject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Mathematics',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.teacherAssignment.findFirst.mockResolvedValue(null);
      fakeTx.db.teacherAssignment.create.mockResolvedValue({
        id: 'asg-new',
        teacherUserId: 't-1',
        sectionId: 'sec-1',
        subjectId: 'sub-1',
        isClassTeacher: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacherUser: { name: 'Teacher 1', email: 't1@example.com' },
        section: {
          name: 'Section A',
          classId: 'c-1',
          class: { name: 'Class 8', code: 'C8' },
        },
        subject: { name: 'Mathematics', code: 'MATH' },
      });

      const res = await service.createAssignment(
        fakeTenant,
        {
          teacherUserId: 't-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          isClassTeacher: false,
        },
        fakeMeta,
      );

      expect(res.id).toBe('asg-new');
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('rejects if teacher membership not found or not a teacher', async () => {
      fakeTx.db.schoolMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.createAssignment(
          fakeTenant,
          {
            teacherUserId: 'non-teacher',
            sectionId: 'sec-1',
            isClassTeacher: false,
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects duplicate assignment', async () => {
      fakeTx.db.schoolMembership.findFirst.mockResolvedValue({
        id: 'mem-1',
        user: { name: 'Teacher 1', email: 't1@example.com' },
        membershipRoles: [{ role: { key: 'teacher' } }],
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'sec-1',
        name: 'Section A',
        class: { name: 'Class 8', code: 'C8' },
      });
      fakeTx.db.teacherAssignment.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createAssignment(
          fakeTenant,
          {
            teacherUserId: 't-1',
            sectionId: 'sec-1',
            isClassTeacher: false,
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteAssignment', () => {
    it('deletes assignment and logs audit', async () => {
      fakeTx.db.teacherAssignment.findFirst.mockResolvedValue({
        id: 'asg-1',
        teacherUserId: 't-1',
        sectionId: 'sec-1',
        subjectId: null,
        teacherUser: { name: 'Teacher 1' },
        section: { name: 'Section A' },
      });
      fakeTx.db.teacherAssignment.delete.mockResolvedValue({ id: 'asg-1' });

      await service.deleteAssignment(fakeTenant, 'asg-1', fakeMeta);
      expect(fakeTx.db.teacherAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'asg-1' },
      });
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('throws not found if assignment does not exist', async () => {
      fakeTx.db.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAssignment(fakeTenant, 'nonexistent', fakeMeta),
      ).rejects.toThrow(AppError);
    });
  });

  describe('listEligibleTeachers', () => {
    it('returns teachers active in the school', async () => {
      fakeTx.db.schoolMembership.findMany.mockResolvedValue([
        {
          userId: 't-1',
          user: { id: 't-1', name: 'Teacher One', email: 't1@example.com' },
        },
      ]);
      fakeTx.db.teacherAssignment.groupBy!.mockResolvedValue([
        {
          teacherUserId: 't-1',
          _count: { id: 2 },
        },
      ]);

      const teachers = await service.listEligibleTeachers(fakeTenant);
      expect(teachers).toHaveLength(1);
      expect(teachers[0]?.name).toBe('Teacher One');
      expect(teachers[0]?.assignmentCount).toBe(2);
    });
  });
});
