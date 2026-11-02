import { z } from 'zod';

import { cursorSchema, pageSizeSchema, searchQuerySchema } from '../common/schemas.js';
import { SCHOOL_STATUSES } from '../schools/schemas.js';

export const listPlatformSchoolsQuerySchema = z.object({
  q: searchQuerySchema.optional(),
  status: z.enum(SCHOOL_STATUSES).optional(),
  cursor: cursorSchema.optional(),
  limit: pageSizeSchema,
});
export type ListPlatformSchoolsQuery = z.infer<typeof listPlatformSchoolsQuerySchema>;

export const updateSchoolStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'archived']),
});
export type UpdateSchoolStatusInput = z.infer<typeof updateSchoolStatusSchema>;

export const listPlatformUsersQuerySchema = z.object({
  q: searchQuerySchema.optional(),
  cursor: cursorSchema.optional(),
  limit: pageSizeSchema,
});
export type ListPlatformUsersQuery = z.infer<typeof listPlatformUsersQuerySchema>;
