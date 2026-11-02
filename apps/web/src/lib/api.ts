import type { ApiResponse } from '@eduflow/types';

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
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
