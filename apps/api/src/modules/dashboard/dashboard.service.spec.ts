import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { DashboardService } from './dashboard.service.js';
import type { AppDatabase, TenantTx } from '../../infrastructure/database/app-database.js';
import { AppError } from '../../common/errors/app-error.js';

interface MockPrismaModel {
  findMany: jest.Mock<() => Promise<unknown>>;
  findFirst: jest.Mock<() => Promise<unknown>>;
  count: jest.Mock<() => Promise<unknown>>;
  create: jest.Mock<() => Promise<unknown>>;
  update: jest.Mock<() => Promise<unknown>>;
  delete: jest.Mock<() => Promise<unknown>>;
}

interface MockPrismaClient {
  studentProfile: MockPrismaModel;
  guardianStudent: MockPrismaModel;
  teacherAssignment: MockPrismaModel;
  schoolMembership: MockPrismaModel;
  membershipRole: MockPrismaModel;
  class: MockPrismaModel;
  section: MockPrismaModel;
  subject: MockPrismaModel;
  auditLog: MockPrismaModel;
}

interface FakeTransaction {
  schoolId: string;
  userId: string;
  db: MockPrismaClient;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let fakeTx: FakeTransaction;
  let mockDb: AppDatabase;

  const createTenant = (roles: { id: string; key: string | null; name: string }[] = []): TenantContext =>
    ({
      schoolId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
      userId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6d',
      membershipId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6c',
      school: {
        id: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
        slug: 'greenfield',
        name: 'Greenfield International',
        status: 'active',
        currencyCode: 'BDT',
      },
      roles,
      permissions: {
        has: (key: string) =>
          roles.some((r) => r.key === 'school_owner') ||
          (roles.some((r) => r.key === 'teacher') && ['academics.view', 'attendance.view'].includes(key)) ||
          (roles.some((r) => r.key === 'accountant') && ['fees.view'].includes(key)),
        covers: () => true,
        hasAll: () => true,
      },
    } as unknown as TenantContext);

  const createMockModel = (): MockPrismaModel => ({
    findMany: jest.fn<() => Promise<unknown>>(),
    findFirst: jest.fn<() => Promise<unknown>>(),
    count: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  });

  beforeEach(() => {
    fakeTx = {
      schoolId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
      userId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6d',
      db: {
        studentProfile: createMockModel(),
        guardianStudent: createMockModel(),
        teacherAssignment: createMockModel(),
        schoolMembership: createMockModel(),
        membershipRole: createMockModel(),
        class: createMockModel(),
        section: createMockModel(),
        subject: createMockModel(),
        auditLog: createMockModel(),
      },
    };

    mockDb = {
      withTenant: jest.fn(
        <T>(_tenant: TenantContext, callback: (tx: TenantTx) => Promise<T>): Promise<T> =>
          callback(fakeTx as unknown as TenantTx),
      ),
    } as unknown as AppDatabase;

    service = new DashboardService(mockDb);
  });

  describe('Workspace Discovery & Multi-Role Support', () => {
    it('discovers single role for school owner', () => {
      const tenant = createTenant([{ id: 'r1', key: 'school_owner', name: 'School Owner' }]);
      const result = service.getAvailableWorkspaces(tenant);
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0]?.type).toBe('owner');
      expect(result.defaultWorkspace).toBe('owner');
    });

    it('discovers multi-role workspaces for Teacher + Guardian with correct primary default', () => {
      const tenant = createTenant([
        { id: 'r1', key: 'teacher', name: 'Teacher' },
        { id: 'r2', key: 'guardian', name: 'Parent/Guardian' },
      ]);
      const result = service.getAvailableWorkspaces(tenant);
      expect(result.workspaces).toHaveLength(2);
      const types = result.workspaces.map((w) => w.type);
      expect(types).toContain('teacher');
      expect(types).toContain('guardian');
      expect(result.defaultWorkspace).toBe('teacher');
    });

    it('discovers multi-role workspaces for Admin + Accountant', () => {
      const tenant = createTenant([
        { id: 'r1', key: 'school_admin', name: 'School Admin' },
        { id: 'r2', key: 'accountant', name: 'Accountant' },
      ]);
      const result = service.getAvailableWorkspaces(tenant);
      expect(result.workspaces.map((w) => w.type)).toEqual(['admin', 'accountant']);
      expect(result.defaultWorkspace).toBe('admin');
    });
  });

  describe('Admin Dashboard', () => {
    it('computes real metric aggregates and loads recent audit logs', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'school_owner', name: 'School Owner' }]);
      fakeTx.db.studentProfile.count.mockResolvedValue(150);
      fakeTx.db.membershipRole.count.mockResolvedValue(18);
      fakeTx.db.schoolMembership.count.mockResolvedValue(175);
      fakeTx.db.class.count.mockResolvedValue(10);
      fakeTx.db.section.count.mockResolvedValue(20);
      fakeTx.db.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'academics.class.created',
          entityType: 'class',
          entityId: 'c-1',
          actor: { id: 'u-1', name: 'Admin', email: 'admin@school.test' },
          before: null,
          after: null,
          metadata: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Jest',
          createdAt: new Date('2026-10-01T12:00:00.000Z'),
        },
      ]);

      const res = await service.getAdminDashboard(tenant);
      expect(res.metrics.totalStudents).toBe(150);
      expect(res.metrics.totalTeachers).toBe(18);
      expect(res.metrics.totalStaff).toBe(25); // 175 - 150
      expect(res.metrics.totalClasses).toBe(10);
      expect(res.metrics.totalSections).toBe(20);
      expect(res.recentActivities).toHaveLength(1);
      expect(res.recentActivities[0]?.action).toBe('academics.class.created');
    });
  });

  describe('Teacher Dashboard', () => {
    it('retrieves only assigned sections for the authenticated teacher', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'teacher', name: 'Teacher' }]);
      fakeTx.db.teacherAssignment.findMany.mockResolvedValue([
        {
          id: 'ta-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          isClassTeacher: true,
          section: {
            name: 'Section A',
            classId: 'class-8',
            class: { name: 'Class 8', code: 'C8' },
            _count: { students: 35 },
          },
          subject: { name: 'General Science' },
        },
      ]);

      const res = await service.getTeacherDashboard(tenant);
      expect(res.assignedSections).toHaveLength(1);
      expect(res.assignedSections[0]?.className).toBe('Class 8');
      expect(res.assignedSections[0]?.isClassTeacher).toBe(true);
      expect(res.metrics.totalStudents).toBe(35);
      expect(res.metrics.totalClasses).toBe(1);
      expect(res.timetable).toHaveLength(1);
      expect(res.timetable[0]?.subject).toBe('General Science');
    });
  });

  describe('Student Dashboard', () => {
    it('retrieves personal profile and subjects for authenticated student', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'student', name: 'Student' }]);
      fakeTx.db.studentProfile.findFirst.mockResolvedValue({
        id: 'std-1',
        userId: fakeTx.userId,
        admissionNumber: 'ADM-2026-001',
        rollNumber: '01',
        status: 'active',
        classId: 'c-8',
        sectionId: 's-a',
        user: { name: 'Rahim Hasan', email: 'student01@school.test', avatarUrl: null },
        class: { name: 'Class 8' },
        section: { name: 'Section A' },
      });
      fakeTx.db.subject.findMany.mockResolvedValue([
        { id: 'sub-1', name: 'Mathematics', code: 'MATH', type: 'mandatory', creditHours: 3 },
      ]);

      const res = await service.getStudentDashboard(tenant);
      expect(res.student.name).toBe('Rahim Hasan');
      expect(res.student.admissionNumber).toBe('ADM-2026-001');
      expect(res.student.className).toBe('Class 8');
      expect(res.subjects).toHaveLength(1);
    });

    it('fails with 404 if no student profile is enrolled for the user', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'student', name: 'Student' }]);
      fakeTx.db.studentProfile.findFirst.mockResolvedValue(null);

      await expect(service.getStudentDashboard(tenant)).rejects.toThrow(AppError);
    });
  });

  describe('Guardian / Parent Dashboard', () => {
    it('retrieves linked children and child dashboard', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'guardian', name: 'Parent/Guardian' }]);
      fakeTx.db.guardianStudent.findMany.mockResolvedValue([
        {
          id: 'link-1',
          studentId: 'std-1',
          relationship: 'Father',
          isPrimary: true,
          student: {
            userId: 'u-std-1',
            admissionNumber: 'ADM-001',
            rollNumber: '01',
            user: { name: 'Rahim Hasan' },
            class: { name: 'Class 8' },
            section: { name: 'Section A' },
          },
        },
        {
          id: 'link-2',
          studentId: 'std-2',
          relationship: 'Father',
          isPrimary: false,
          student: {
            userId: 'u-std-2',
            admissionNumber: 'ADM-002',
            rollNumber: '02',
            user: { name: 'Ayesha Hasan' },
            class: { name: 'Class 5' },
            section: { name: 'Section B' },
          },
        },
      ]);
      fakeTx.db.subject.findMany.mockResolvedValue([]);

      const res = await service.getGuardianDashboard(tenant, {});
      expect(res.children).toHaveLength(2);
      expect(res.selectedChildId).toBe('std-1');
      expect(res.childDashboard?.student.name).toBe('Rahim Hasan');
    });

    it('rejects access when guardian requests an unlinked student ID', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'guardian', name: 'Parent/Guardian' }]);
      fakeTx.db.guardianStudent.findMany.mockResolvedValue([
        {
          id: 'link-1',
          studentId: 'std-1',
          relationship: 'Father',
          isPrimary: true,
          student: {
            userId: 'u-std-1',
            admissionNumber: 'ADM-001',
            rollNumber: '01',
            user: { name: 'Rahim Hasan' },
            class: { name: 'Class 8' },
            section: { name: 'Section A' },
          },
        },
      ]);

      await expect(
        service.getGuardianDashboard(tenant, { studentId: '018f3a2b-0000-0000-0000-000000000099' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('Accountant & Planned Workspaces', () => {
    it('returns fee structures and transactions for accountant', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'accountant', name: 'Accountant' }]);
      fakeTx.db.class.count.mockResolvedValue(6);
      fakeTx.db.studentProfile.count.mockResolvedValue(120);

      const res = await service.getAccountantDashboard(tenant);
      expect(res.feeStructuresCount).toBe(6);
      expect(res.metrics.totalCollected).toBeGreaterThan(0);
      expect(res.recentTransactions).toHaveLength(2);
    });

    it('allows school owner to retrieve financial dashboard data', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'school_owner', name: 'School Owner' }]);
      fakeTx.db.class.count.mockResolvedValue(10);
      fakeTx.db.studentProfile.count.mockResolvedValue(250);

      const res = await service.getAccountantDashboard(tenant);
      expect(res.feeStructuresCount).toBe(10);
      expect(res.metrics.totalCollected).toBeGreaterThan(0);
      expect(res.recentTransactions).toHaveLength(2);
    });

    it('returns honest planned state for librarian and hr staff', async () => {
      const tenant = createTenant([{ id: 'r1', key: 'librarian', name: 'Librarian' }]);
      const lib = service.getLibrarianDashboard(tenant);
      expect(lib.status).toBe('planned');
      expect(lib.module).toBe('library');

      fakeTx.db.schoolMembership.count.mockResolvedValue(15);
      const hr = await service.getHrDashboard(tenant);
      expect(hr.status).toBe('planned');
      expect(hr.module).toBe('hr');
      expect(hr.metrics['Active Staff Members']).toBe(15);
    });
  });
});
