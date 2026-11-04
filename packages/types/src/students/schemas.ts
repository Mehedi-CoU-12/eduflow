import { z } from 'zod';
import { cursorSchema, pageSizeSchema, searchQuerySchema, uuidSchema } from '../common/schemas.js';
import type { StudentProfileDto } from '../workspace/types.js';

// -----------------------------------------------------------------------------
// Admissions & Student Profile Schemas
// -----------------------------------------------------------------------------

export const admitStudentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  phone: z.string().trim().max(30).optional().nullable(),
  classId: uuidSchema,
  sectionId: uuidSchema,
  admissionNumber: z.string().trim().min(1).max(50).optional(),
  rollNumber: z.string().trim().max(20).optional().nullable(),
  initialPassword: z.string().min(8).max(128).optional(),
  guardianEmail: z.string().trim().toLowerCase().max(254).pipe(z.email()).optional().nullable(),
  guardianRelationship: z.string().trim().max(50).optional().nullable(),
});
export type AdmitStudentInput = z.infer<typeof admitStudentSchema>;

export const updateStudentProfileSchema = z.object({
  rollNumber: z.string().trim().max(20).optional().nullable(),
  status: z.enum(['active', 'archived', 'transferred', 'graduated']).optional(),
});
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

export const listStudentsQuerySchema = z.object({
  q: searchQuerySchema.optional(),
  classId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  status: z.string().optional(),
  cursor: cursorSchema.optional(),
  limit: pageSizeSchema,
});
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;

// -----------------------------------------------------------------------------
// Classroom Rostering Schemas
// -----------------------------------------------------------------------------

export const transferStudentsSchema = z.object({
  studentIds: z.array(uuidSchema).min(1).max(100),
  targetClassId: uuidSchema,
  targetSectionId: uuidSchema,
});
export type TransferStudentsInput = z.infer<typeof transferStudentsSchema>;

export interface SectionRosterSummaryDto {
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  classCode: string;
  capacity: number | null;
  enrolledCount: number;
}

export interface SectionRosterDto {
  section: SectionRosterSummaryDto;
  students: StudentProfileDto[];
}

// -----------------------------------------------------------------------------
// Faculty Assignment Schemas
// -----------------------------------------------------------------------------

export const createFacultyAssignmentSchema = z.object({
  teacherUserId: uuidSchema,
  sectionId: uuidSchema,
  subjectId: uuidSchema.optional().nullable(),
  isClassTeacher: z.boolean().default(false),
});
export type CreateFacultyAssignmentInput = z.infer<typeof createFacultyAssignmentSchema>;

export const listFacultyAssignmentsQuerySchema = z.object({
  teacherUserId: uuidSchema.optional(),
  classId: uuidSchema.optional(),
  sectionId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
});
export type ListFacultyAssignmentsQuery = z.infer<typeof listFacultyAssignmentsQuerySchema>;

export interface FacultyAssignmentDetailDto {
  id: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  classId: string;
  className: string;
  classCode: string;
  sectionId: string;
  sectionName: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectCode: string | null;
  isClassTeacher: boolean;
  createdAt: string;
}

export interface EligibleTeacherDto {
  userId: string;
  name: string;
  email: string;
  assignmentCount: number;
}

