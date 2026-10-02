import type { ErrorCode } from './error-codes.js';

/** Every successful response: `{ success: true, data, meta? }`. */
export interface ApiSuccess<TData, TMeta = undefined> {
  success: true;
  data: TData;
  meta?: TMeta;
}

export interface ValidationIssue {
  /** Path to the offending field, e.g. `["email"]`. */
  path: (string | number)[];
  message: string;
}

export interface ApiErrorDetail {
  code: ErrorCode;
  message: string;
  /** Field-level issues for VALIDATION_FAILED; otherwise optional extra context. */
  details?: ValidationIssue[] | Record<string, unknown>;
  /** Correlates the response with server logs and audit entries. */
  requestId?: string;
}

/** Every failed response: `{ success: false, error }`. */
export interface ApiFailure {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<TData, TMeta = undefined> = ApiSuccess<TData, TMeta> | ApiFailure;

/** `meta` for cursor-paginated collections. */
export interface CursorPageMeta {
  /** Pass as `cursor` to fetch the next page; `null` when this is the last page. */
  nextCursor: string | null;
  limit: number;
}
