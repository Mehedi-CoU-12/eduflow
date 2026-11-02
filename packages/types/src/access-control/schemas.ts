import { z } from 'zod';

import { PERMISSION_SCOPES } from './permissions.js';

export const roleGrantSchema = z.object({
  key: z.string().min(1),
  scope: z.enum(PERMISSION_SCOPES).default('all'),
});
export type RoleGrantInput = z.infer<typeof roleGrantSchema>;

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().max(255).optional(),
  grants: z.array(roleGrantSchema).min(1),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  grants: z.array(roleGrantSchema).min(1).optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
