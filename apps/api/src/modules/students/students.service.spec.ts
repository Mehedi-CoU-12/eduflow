import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { StudentsService } from './students.service.js';
import type { AppDatabase, TenantTx } from '../../infrastructure/database/app-database.js';
import type { SystemDatabase } from '../../infrastructure/database/system-database.js';
import type { AuditService } from '../audit/audit.service.js';
import type { UserProvisioningService } from '../auth/user-provisioning.service.js';
import type { PasswordService } from '../auth/password.service.js';
import type { MailService } from '../../infrastructure/mail/mail.service.js';
import type { AuthTokenService } from '../auth/auth-token.service.js';
import type { AppConfig } from '../../config/env.js';
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
  let mockMail: MailService;
  let mockTokens: AuthTokenService;
  let mockConfig: AppConfig;

  const fakeTenant = {
    schoolId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
    userId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6d',
    membershipId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6c',
    school: { id: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b', slug: 'greenwood', defaultLocale: 'en' },
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
        user: {
          findUnique: jest.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'user-new-student', emailVerifiedAt: null }),
          update: jest.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'user-new-student' }),
        },
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
        id: 'user-new-student',
        email: 'student@example.com',
        name: 'Alice Student',
        hasCredential: false,
      }),
    } as unknown as UserProvisioningService;

    mockPasswordService = {
      hash: jest.fn<() => Promise<string>>().mockResolvedValue('$argon2id$mockhash'),
      generateTemporary: jest.fn<() => string>().mockReturnValue('TempPass123!'),
    } as unknown as PasswordService;

    mockMail = {
      send: jest.fn<() => Promise<void>>().mockResolvedValue(),
    } as unknown as MailService;

    mockTokens = {
      issue: jest.fn<() => Promise<string>>().mockResolvedValue('mock-verification-token'),
      consume: jest.fn<() => Promise<string | null>>().mockResolvedValue('user-new-student'),
    } as unknown as AuthTokenService;

    mockConfig = {
      hosts: {
        publicUrl: 'http://localhost:3100',
        baseDomain: 'localhost',
      },
    } as unknown as AppConfig;

    service = new StudentsService(
      mockDb,
      mockSystemDb,
      mockAudit,
      mockUserProvisioning,
      mockPasswordService,
      mockMail,
      mockTokens,
      mockConfig,
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
      expect(mockTokens.issue).toHaveBeenCalledWith('user-new-student', 'email_verification', expect.any(Number));
      expect(mockMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          template: 'verifyEmail',
        }),
      );
    });

    it('verifies email immediately when requested', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({ id: 'class-1', name: 'Class 8', schoolId: fakeTenant.schoolId });
      fakeTx.db.section.findFirst.mockResolvedValue({ id: 'section-1', classId: 'class-1', name: 'Section A', capacity: 40, schoolId: fakeTenant.schoolId });
      fakeTx.db.studentProfile.count.mockResolvedValue(0);
      fakeTx.db.role.findFirst.mockResolvedValue({ id: 'role-student', key: 'student' });
      fakeTx.db.schoolMembership.upsert.mockResolvedValue({ id: 'membership-student' });
      fakeTx.db.membershipRole.create.mockResolvedValue({ id: 'mr-1' });
      fakeTx.db.studentProfile.create.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-new-student',
        classId: 'class-1',
        sectionId: 'section-1',
        admissionNumber: 'ADM-2026-0001',
        rollNumber: '01',
        status: 'active',
        user: { name: 'Alice Student', email: 'student@example.com', avatarUrl: null, emailVerifiedAt: new Date() },
        class: { name: 'Class 8' },
        section: { name: 'Section A' },
      });

      await service.admitStudent(
        fakeTenant,
        {
          name: 'Alice Student',
          email: 'student@example.com',
          classId: 'class-1',
          sectionId: 'section-1',
          verifyEmailImmediately: true,
        },
        fakeMeta,
      );

      expect(mockSystemDb.client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-new-student' },
          data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
        }),
      );
      expect(mockMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          template: 'schoolInvite',
        }),
      );
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
    it('returns section roster with capacity calculations', async () => {
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-1',
        name: 'Section A',
        capacity: 40,
        class: { id: 'class-1', name: 'Class 8', code: 'C8' },
      });
      fakeTx.db.studentProfile.findMany.mockResolvedValue([
        {
          id: 'sp-1',
          userId: 'u-1',
          classId: 'class-1',
          sectionId: 'section-1',
          admissionNumber: 'ADM-1',
          rollNumber: '01',
          status: 'active',
          user: { name: 'Student 1', email: 's1@test.com', avatarUrl: null },
          class: { name: 'Class 8' },
          section: { name: 'Section A' },
        },
      ]);

      const roster = await service.getSectionRoster(fakeTenant, 'section-1');
      expect(roster.section.sectionId).toBe('section-1');
      expect(roster.section.className).toBe('Class 8');
      expect(roster.section.capacity).toBe(40);
      expect(roster.section.enrolledCount).toBe(1);
      expect(roster.students).toHaveLength(1);
    });
  });

  describe('transferStudents', () => {
    it('transfers students to another section if capacity permits', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({
        id: 'class-2',
        name: 'Class 2',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-2',
        classId: 'class-2',
        name: 'Section B',
        capacity: 35,
        schoolId: fakeTenant.schoolId,
        class: { name: 'Class 2' },
      });
      fakeTx.db.studentProfile.count.mockResolvedValue(10);
      fakeTx.db.studentProfile.findMany.mockResolvedValue([
        { id: 'sp-1', admissionNumber: 'ADM-1' },
        { id: 'sp-2', admissionNumber: 'ADM-2' },
      ]);
      fakeTx.db.studentProfile.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.transferStudents(
        fakeTenant,
        {
          studentIds: ['sp-1', 'sp-2'],
          targetClassId: 'class-2',
          targetSectionId: 'section-2',
        },
        fakeMeta,
      );

      expect(result.transferredCount).toBe(2);
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('rejects transfer if target section would exceed capacity', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue({
        id: 'class-2',
        name: 'Class 2',
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.section.findFirst.mockResolvedValue({
        id: 'section-2',
        classId: 'class-2',
        name: 'Section B',
        capacity: 10,
        schoolId: fakeTenant.schoolId,
      });
      fakeTx.db.studentProfile.count.mockResolvedValue(9);

      await expect(
        service.transferStudents(
          fakeTenant,
          {
            studentIds: ['sp-1', 'sp-2'],
            targetClassId: 'class-2',
            targetSectionId: 'section-2',
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('Guardian Linking', () => {
    it('links guardian to student', async () => {
      fakeTx.db.studentProfile.findFirst.mockResolvedValue({
        id: 'sp-1',
        schoolId: fakeTenant.schoolId,
        user: { name: 'Alice Student' },
      });
      fakeTx.db.schoolMembership.findFirst.mockResolvedValue({
        id: 'membership-g',
        userId: 'guardian-u1',
        user: { name: 'Mrs. Parent', email: 'parent@test.com' },
        membershipRoles: [{ role: { key: 'guardian' } }],
      });
      fakeTx.db.guardianStudent.findUnique.mockResolvedValue(null);
      fakeTx.db.guardianStudent.create.mockResolvedValue({
        id: 'gs-1',
        guardianUserId: 'guardian-u1',
        studentId: 'sp-1',
        relationship: 'Mother',
        isPrimary: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        guardianUser: { name: 'Mrs. Parent', email: 'parent@test.com' },
        student: {
          id: 'sp-1',
          admissionNumber: 'ADM-1',
          rollNumber: '01',
          class: { name: 'Class 8' },
          section: { name: 'Section A' },
          user: { name: 'Alice Student', email: 's@test.com' },
        },
      });

      const link = await service.linkGuardianStudent(
        fakeTenant,
        'guardian-u1',
        {
          studentId: 'sp-1',
          relationship: 'Mother',
          isPrimary: true,
        },
        fakeMeta,
      );

      expect(link.id).toBe('gs-1');
      expect(link.relationship).toBe('Mother');
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('rejects duplicate guardian link', async () => {
      fakeTx.db.studentProfile.findFirst.mockResolvedValue({
        id: 'sp-1',
        schoolId: fakeTenant.schoolId,
        user: { name: 'Alice Student' },
      });
      fakeTx.db.schoolMembership.findFirst.mockResolvedValue({
        id: 'membership-g',
        userId: 'guardian-u1',
        user: { name: 'Mrs. Parent', email: 'parent@test.com' },
        membershipRoles: [{ role: { key: 'guardian' } }],
      });
      fakeTx.db.guardianStudent.findUnique.mockResolvedValue({
        id: 'existing-gs',
      });

      await expect(
        service.linkGuardianStudent(
          fakeTenant,
          'guardian-u1',
          {
            studentId: 'sp-1',
            relationship: 'Father',
            isPrimary: true,
          },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('verifyStudentEmail', () => {
    it('manually verifies student user email', async () => {
      fakeTx.db.studentProfile.findFirst.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-new-student',
        schoolId: fakeTenant.schoolId,
        admissionNumber: 'ADM-2026-0001',
        rollNumber: '01',
        status: 'active',
        classId: 'class-1',
        sectionId: 'section-1',
        user: { name: 'Alice Student', email: 'student@example.com', avatarUrl: null, emailVerifiedAt: null },
        class: { name: 'Class 8' },
        section: { name: 'Section A' },
      });

      const updated = await service.verifyStudentEmail(fakeTenant, 'sp-1', fakeMeta);

      expect(mockSystemDb.client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-new-student' },
          data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalled();
      expect(updated.id).toBe('sp-1');
    });
  });
});
