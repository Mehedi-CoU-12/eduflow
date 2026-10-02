import { AppError } from '../errors/app-error.js';

/**
 * Opaque keyset-pagination cursors: base64url-encoded JSON. Clients must treat them as
 * opaque strings; the API validates the decoded shape before using it.
 */
export function encodeCursor(value: Record<string, string>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor<K extends string>(cursor: string, keys: readonly K[]): Record<K, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }
  if (typeof parsed !== 'object' || parsed === null) throw invalidCursor();
  const record = parsed as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] !== 'string') throw invalidCursor();
  }
  return record as Record<K, string>;
}

function invalidCursor(): AppError {
  return AppError.validation([{ path: ['cursor'], message: 'Invalid cursor' }]);
}
