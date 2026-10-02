import { z } from 'zod';

import { cursorSchema, pageSizeSchema, searchQuerySchema } from '../common/schemas.js';

export const MEMBERSHIP_STATUSES = ['invited', 'active', 'suspended', 'removed'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const listMembersQuerySchema = z.object({
  q: searchQuerySchema.optional(),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
  roleId: z.uuid().optional(),
  cursor: cursorSchema.optional(),
  limit: pageSizeSchema,
});
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;

export const updateMemberRolesSchema = z.object({
  roleIds: z
    .array(z.uuid())
    .min(1)
    .max(10)
    .transform((ids) => [...new Set(ids)]),
});
export type UpdateMemberRolesInput = z.infer<typeof updateMemberRolesSchema>;
