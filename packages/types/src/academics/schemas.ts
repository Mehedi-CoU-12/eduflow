import { z } from 'zod';

import { searchQuerySchema } from '../common/schemas.js';

export const ACADEMIC_YEAR_STATUSES = ['upcoming', 'active', 'archived'] as const;
export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUSES)[number];

export const TERM_STATUSES = ['upcoming', 'active', 'completed'] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];

export const SUBJECT_TYPES = ['mandatory', 'elective'] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

// Academic Year
export const listAcademicYearsQuerySchema = z.object({
  status: z.enum(ACADEMIC_YEAR_STATUSES).optional(),
});
export type ListAcademicYearsQuery = z.infer<typeof listAcademicYearsQuerySchema>;

export const createAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(50),
    startDate: z.string().datetime({ message: 'Start date must be an ISO 8601 timestamp' }),
    endDate: z.string().datetime({ message: 'End date must be an ISO 8601 timestamp' }),
    status: z.enum(ACADEMIC_YEAR_STATUSES).default('upcoming'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;

export const updateAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(ACADEMIC_YEAR_STATUSES).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;

// Term
export const listTermsQuerySchema = z.object({
  academicYearId: z.uuid().optional(),
  status: z.enum(TERM_STATUSES).optional(),
});
export type ListTermsQuery = z.infer<typeof listTermsQuerySchema>;

export const createTermSchema = z
  .object({
    academicYearId: z.uuid(),
    name: z.string().trim().min(1, 'Name is required').max(50),
    startDate: z.string().datetime({ message: 'Start date must be an ISO 8601 timestamp' }),
    endDate: z.string().datetime({ message: 'End date must be an ISO 8601 timestamp' }),
    status: z.enum(TERM_STATUSES).default('upcoming'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateTermInput = z.infer<typeof createTermSchema>;

export const updateTermSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(TERM_STATUSES).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );
export type UpdateTermInput = z.infer<typeof updateTermSchema>;

// Class
export const listClassesQuerySchema = z.object({
  q: searchQuerySchema.optional(),
});
export type ListClassesQuery = z.infer<typeof listClassesQuerySchema>;

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens and underscores'),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens and underscores')
    .optional(),
});
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

// Section
export const listSectionsQuerySchema = z.object({
  classId: z.uuid().optional(),
});
export type ListSectionsQuery = z.infer<typeof listSectionsQuerySchema>;

export const createSectionSchema = z.object({
  classId: z.uuid(),
  name: z.string().trim().min(1, 'Name is required').max(50),
  capacity: z.coerce.number().int().positive().max(1000).optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  capacity: z.coerce.number().int().positive().max(1000).nullish(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// Subject
export const listSubjectsQuerySchema = z.object({
  q: searchQuerySchema.optional(),
  type: z.enum(SUBJECT_TYPES).optional(),
});
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code may only contain letters, numbers, dots, hyphens and underscores'),
  type: z.enum(SUBJECT_TYPES).default('mandatory'),
  creditHours: z.coerce.number().positive().max(50).optional(),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code may only contain letters, numbers, dots, hyphens and underscores')
    .optional(),
  type: z.enum(SUBJECT_TYPES).optional(),
  creditHours: z.coerce.number().positive().max(50).nullish(),
});
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
