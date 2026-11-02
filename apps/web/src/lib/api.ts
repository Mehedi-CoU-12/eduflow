import type { ApiResponse, ValidationIssue } from '@eduflow/types';

export class ApiRequestError extends Error {
  public readonly validationIssues: ValidationIssue[];
  public readonly fieldErrors: Record<string, string>;

  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    const issues: ValidationIssue[] = [];
    const fields: Record<string, string> = {};

    if (code === 'VALIDATION_FAILED' && Array.isArray(details)) {
      for (const item of details) {
        if (item && typeof item === 'object' && 'message' in item) {
          const issue = item as ValidationIssue;
          issues.push(issue);
          const field = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : '';
          if (field) {
            fields[field] = issue.message;
          }
        }
      }
    }

    let finalMessage = message;
    if (code === 'VALIDATION_FAILED' && issues.length > 0) {
      finalMessage = issues
        .map((issue) => {
          const field = Array.isArray(issue.path) && issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
          return `${field}${issue.message}`;
        })
        .join('; ');
    }

    super(finalMessage);
    this.name = 'ApiRequestError';
    this.validationIssues = issues;
    this.fieldErrors = fields;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = normalizedPath.startsWith('/api/') ? normalizedPath : `/api/v1${normalizedPath}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const json: ApiResponse<T> = await res.json().catch(() => ({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Failed to parse JSON response',
    },
  }));

  if ('error' in json) {
    throw new ApiRequestError(
      json.error.code,
      json.error.message,
      res.status,
      json.error.details,
    );
  }

  return json.data;
}
