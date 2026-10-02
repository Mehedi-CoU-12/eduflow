import { z } from 'zod';

export const uuidSchema = z.uuid();

/** Opaque, URL-safe pagination cursor produced by the API. */
export const cursorSchema = z
  .string()
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/);

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);

/** Free-text search input used by list endpoints. */
export const searchQuerySchema = z.string().trim().min(1).max(100);
