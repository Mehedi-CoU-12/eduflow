import { describe, expect, it } from '@jest/globals';

import {
  createAcademicYearSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createTermSchema,
} from './schemas.js';

describe('academics schemas', () => {
  describe('createAcademicYearSchema', () => {
    it('accepts valid academic year inputs', () => {
      const parsed = createAcademicYearSchema.parse({
        name: '2026-2027',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        status: 'upcoming',
      });
      expect(parsed.name).toBe('2026-2027');
      expect(parsed.status).toBe('upcoming');
    });

    it('rejects when endDate is not after startDate', () => {
      expect(() =>
        createAcademicYearSchema.parse({
          name: '2026-2027',
          startDate: '2026-12-31T00:00:00.000Z',
          endDate: '2026-01-01T00:00:00.000Z',
        }),
      ).toThrow();
    });
  });

  describe('createTermSchema', () => {
    it('accepts valid term inputs', () => {
      const parsed = createTermSchema.parse({
        academicYearId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
        name: 'Term 1',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-04-30T23:59:59.000Z',
      });
      expect(parsed.name).toBe('Term 1');
      expect(parsed.status).toBe('upcoming');
    });
  });

  describe('createClassSchema', () => {
    it('validates name and alphanumeric code', () => {
      const parsed = createClassSchema.parse({
        name: 'Grade 10',
        code: 'G-10',
      });
      expect(parsed.code).toBe('G-10');
    });

    it('rejects invalid code with special characters', () => {
      expect(() =>
        createClassSchema.parse({
          name: 'Grade 10',
          code: 'G 10!',
        }),
      ).toThrow();
    });
  });

  describe('createSectionSchema', () => {
    it('validates section inputs with capacity', () => {
      const parsed = createSectionSchema.parse({
        classId: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
        name: 'Section A',
        capacity: 40,
      });
      expect(parsed.capacity).toBe(40);
    });
  });

  describe('createSubjectSchema', () => {
    it('validates subject with default mandatory type', () => {
      const parsed = createSubjectSchema.parse({
        name: 'General Mathematics',
        code: 'MATH-101',
      });
      expect(parsed.type).toBe('mandatory');
    });
  });
});
