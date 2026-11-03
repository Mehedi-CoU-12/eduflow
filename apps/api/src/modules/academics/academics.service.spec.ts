import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { AcademicsService } from './academics.service.js';
import type { AppDatabase, TenantTx } from '../../infrastructure/database/app-database.js';
import type { AuditService } from '../audit/audit.service.js';
import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';

interface MockPrismaModel {
  findMany: jest.Mock<() => Promise<unknown>>;
  findFirst: jest.Mock<() => Promise<unknown>>;
  create: jest.Mock<() => Promise<unknown>>;
  update: jest.Mock<() => Promise<unknown>>;
  delete: jest.Mock<() => Promise<unknown>>;
}

interface MockPrismaClient {
  academicYear: MockPrismaModel;
  term: MockPrismaModel;
  class: MockPrismaModel;
  section: MockPrismaModel;
  subject: MockPrismaModel;
}

interface FakeTransaction {
  schoolId: string;
  userId: string;
  db: MockPrismaClient;
}

describe('AcademicsService', () => {
  let service: AcademicsService;
  let fakeTx: FakeTransaction;
  let mockDb: AppDatabase;
  let mockAudit: AuditService;

  const fakeTenant = {
    schoolId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
    userId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6d',
    membershipId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6c',
    school: { id: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b' },
    roles: [],
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
    update: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  });

  beforeEach(() => {
    fakeTx = {
      schoolId: fakeTenant.schoolId,
      userId: fakeTenant.userId,
      db: {
        academicYear: createMockModel(),
        term: createMockModel(),
        class: createMockModel(),
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

    service = new AcademicsService(mockDb, mockAudit);
  });

  describe('Academic Years', () => {
    it('lists academic years with term counts', async () => {
      fakeTx.db.academicYear.findMany.mockResolvedValue([
        {
          id: 'year-1',
          schoolId: fakeTenant.schoolId,
          name: '2026-2027',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-12-31T23:59:59.000Z'),
          status: 'upcoming',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { terms: 2 },
        },
      ]);

      const result = await service.listAcademicYears(fakeTenant, {});
      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first?.name).toBe('2026-2027');
      expect(first?.termCount).toBe(2);
    });

    it('creates an academic year and records an audit log', async () => {
      const createdRecord = {
        id: 'year-1',
        schoolId: fakeTenant.schoolId,
        name: '2026-2027',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T23:59:59.000Z'),
        status: 'upcoming' as const,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      fakeTx.db.academicYear.create.mockResolvedValue(createdRecord);

      const result = await service.createAcademicYear(
        fakeTenant,
        {
          name: '2026-2027',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T23:59:59.000Z',
          status: 'upcoming',
        },
        fakeMeta,
      );

      expect(result.id).toBe('year-1');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: fakeTenant.schoolId }),
        expect.objectContaining({ action: 'academics.academic_year.created', entityId: 'year-1' }),
        fakeMeta,
      );
    });
  });

  describe('Classes & Sections', () => {
    it('creates a class', async () => {
      const createdRecord = {
        id: 'class-1',
        schoolId: fakeTenant.schoolId,
        name: 'Grade 10',
        code: 'G-10',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      fakeTx.db.class.create.mockResolvedValue(createdRecord);

      const result = await service.createClass(
        fakeTenant,
        { name: 'Grade 10', code: 'G-10' },
        fakeMeta,
      );

      expect(result.name).toBe('Grade 10');
      expect(result.code).toBe('G-10');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: fakeTenant.schoolId }),
        expect.objectContaining({ action: 'academics.class.created' }),
        fakeMeta,
      );
    });

    it('rejects section creation if parent class does not exist in tenant', async () => {
      fakeTx.db.class.findFirst.mockResolvedValue(null);

      await expect(
        service.createSection(
          fakeTenant,
          { classId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b', name: 'Section A' },
          fakeMeta,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('Subjects', () => {
    it('lists subjects', async () => {
      fakeTx.db.subject.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          schoolId: fakeTenant.schoolId,
          name: 'Mathematics',
          code: 'MATH-101',
          type: 'mandatory',
          creditHours: 3,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);

      const result = await service.listSubjects(fakeTenant, {});
      expect(result).toHaveLength(1);
      const first = result[0];
      expect(first?.code).toBe('MATH-101');
    });
  });
});
