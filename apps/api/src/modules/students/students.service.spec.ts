import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { StudentsService } from './students.service.js';
import type { AppDatabase, TenantTx } from '../../infrastructure/database/app-database.js';
import type { SystemDatabase } from '../../infrastructure/database/system-database.js';
import type { AuditService } from '../audit/audit.service.js';
import type { UserProvisioningService } from '../auth/user-provisioning.service.js';
import type { PasswordService } from '../auth/password.service.js';
import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';

interface MockPrismaModel {
  findMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  findFirst: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  findUnique: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  count: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  create: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  update: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  updateMany: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  upsert: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  delete: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
}

interface MockPrismaClient {
  studentProfile: MockPrismaModel;
  guardianStudent: MockPrismaModel;
  schoolMembership: MockPrismaModel;
  role: MockPrismaModel;
  membershipRole: MockPrismaModel;
  class: MockPrismaModel;
  section: MockPrismaModel;
  user: MockPrismaModel;
}

interface FakeTransaction {
  schoolId: string;
  userId: string;
  db: MockPrismaClient;
}

describe('StudentsService', () => {
  let service: StudentsService;
  let fakeTx: FakeTransaction;
  let mockDb: AppDatabase;
  let mockSystemDb: SystemDatabase;
  let mockAudit: AuditService;
  let mockUserProvisioning: UserProvisioningService;
  let mockPasswordService: PasswordService;

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
    findUnique: jest.fn<() => Promise<unknown>>(),
    count: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    updateMany: jest.fn<() => Promise<unknown>>(),
    upsert: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  });

  beforeEach(() => {
    fakeTx = {
      schoolId: fakeTenant.schoolId,
      userId: fakeTenant.userId,
      db: {
        studentProfile: createMockModel(),
        guardianStudent: createMockModel(),
        schoolMembership: createMockModel(),
        role: createMockModel(),
        membershipRole: createMockModel(),
        class: createMockModel(),
        section: createMockModel(),
        user: createMockModel(),
      },
    };

    mockDb = {
      withTenant: jest.fn(
        <T>(_tenant: TenantContext, callback: (tx: TenantTx) => Promise<T>): Promise<T> =>
          callback(fakeTx as unknown as TenantTx),
      ),
    } as unknown as AppDatabase;

    mockSystemDb = {
      client: {
        userCredential: {
          findUnique: jest.fn<() => Promise<unknown>>().mockResolvedValue(null),
          create: jest.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'cred-1' }),
        },
      },
    } as unknown as SystemDatabase;

    mockAudit = {
      record: jest.fn<() => Promise<void>>().mockResolvedValue(),
    } as unknown as AuditService;

    mockUserProvisioning = {
      findOrCreateForInvite: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        user: { id: 'user-new-student', email: 'student@example.com', name: 'Alice Student' },
        isNewUser: true,
      }),
    } as unknown as UserProvisioningService;

    mockPasswordService = {
      hash: jest.fn<() => Promise<string>>().mockResolvedValue('$argon2id$mockhash'),
      generateTemporary: jest.fn<() => string>().mockReturnValue('TempPass123!'),
    } as unknown as PasswordService;

    service = new StudentsService(
      mockDb,
      mockSystemDb,
      mockAudit,
      mockUserProvisioning,
      mockPasswordService,
    );
  });

  describe('admitStudent', () => {
    it('successfully admits a new student and generates admission number', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({
        id: 'class-1',
        name: 'Class 8',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-1',
        classId: 'class-1',
        name: 'Section A',
        capacity: 40,
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.studentProfile.count.mockResolvedValue(0);
      fakeTx.db.role.findFirst.mockResolvedValue({
        id: 'role-student',
        key: 'student',
      });
      fakeTx.db.schoolMembership.create.mockResolvedValue({
        id: 'membership-student',
      });
      fakeTx.db.schoolMembership.upsert.mockResolvedValue({
        id: 'membership-student',
      });
      fakeTx.db.membershipRole.create.mockResolvedValue({
        id: 'mr-1',
      });
      fakeTx.db.studentProfile.create.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-new-student',
        classId: 'class-1',
        sectionId: 'section-1',
        admissionNumber: 'ADM-2026-0001',
        rollNumber: '01',
        status: 'active',
        user: {
          name: 'Alice Student',
          email: 'student@example.com',
          avatarUrl: null,
        },
        class: { name: 'Class 8' },
        section: { name: 'Section A' },
      });

      const result = await service.admitStudent(
        fakeTenant,
        {
          name: 'Alice Student',
          email: 'student@example.com',
          classId: 'class-1',
          sectionId: 'section-1',
          rollNumber: '01',
        },
        fakeMeta,
      );

      expect(result.id).toBe('sp-1');
      expect(result.name).toBe('Alice Student');
      expect(result.admissionNumber).toBe('ADM-2026-0001');
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('rejects if class is not found', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue(null);

      await expect(
        service.admitStudent(
          fakeTenant,
          {
            name: 'Alice Student',
            email: 'student@example.com',
            classId: 'invalid-class',
            sectionId: 'section-1',
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects if section capacity is exceeded', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({
        id: 'class-1',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-1',
        classId: 'class-1',
        capacity: 30,
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.studentProfile.count.mockResolvedValue(30);

      await expect(
        service.admitStudent(
          fakeTenant,
          {
            name: 'Alice Student',
            email: 'student@example.com',
            classId: 'class-1',
            sectionId: 'section-1',
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });

    it('rejects if custom admission number already exists', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({
        id: 'class-1',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-1',
        classId: 'class-1',
        capacity: null,
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.studentProfile.findFirst.mockResolvedValue({
        id: 'sp-existing',
        admissionNumber: 'CUSTOM-001',
      });

      await expect(
        service.admitStudent(
          fakeTenant,
          {
            name: 'Alice Student',
            email: 'student@example.com',
            classId: 'class-1',
            sectionId: 'section-1',
            admissionNumber: 'CUSTOM-001',
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('getSectionRoster', () => {
  });
});
