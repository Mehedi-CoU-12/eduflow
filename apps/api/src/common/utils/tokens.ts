import { createHash, randomBytes } from 'node:crypto';

/** 256-bit random token, base64url-encoded (43 characters). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Tokens are 256-bit random values, so a fast hash is sufficient: there is nothing to
 * brute-force. Only hashes are stored, never the tokens themselves.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
