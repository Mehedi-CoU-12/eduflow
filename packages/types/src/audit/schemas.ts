import { z } from 'zod';

import { cursorSchema, pageSizeSchema, searchQuerySchema } from '../common/schemas.js';

export const listAuditLogsQuerySchema = z.object({
  action: searchQuerySchema.optional(),
  entityType: searchQuerySchema.optional(),
  cursor: cursorSchema.optional(),
  limit: pageSizeSchema,
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
