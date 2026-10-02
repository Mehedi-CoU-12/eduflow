import type { Prisma } from '../../generated/prisma/client.js';

/** Converts a value (Dates included) into plain JSON for a Prisma Json column. */
export function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
