import { Injectable } from '@nestjs/common';

import { generateToken, hashToken, isWellFormedToken } from '../../common/utils/tokens.js';
import type { AuthTokenType } from '../../generated/prisma/client.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';

/** Single-use tokens delivered by email. Only their hashes are stored. */
@Injectable()
export class AuthTokenService {
  constructor(private readonly system: SystemDatabase) {}

  /** Issues a new token and invalidates any unused token of the same type for the user. */
  async issue(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
    const token = generateToken();
    const db = this.system.client;
    await db.$transaction([
      db.authToken.deleteMany({ where: { userId, type, consumedAt: null } }),
      db.authToken.create({
        data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
        select: { id: true },
      }),
    ]);
    return token;
  }

  /**
   * Atomically marks the token as used and returns its user, or null if it is unknown,
   * expired or already used. Concurrent attempts cannot both succeed.
   */
  async consume(token: string, type: AuthTokenType): Promise<string | null> {
    if (!isWellFormedToken(token)) return null;
    const tokenHash = hashToken(token);
    return this.system.client.$transaction(async (tx) => {
      const now = new Date();
      const { count } = await tx.authToken.updateMany({
        where: { tokenHash, type, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (count !== 1) return null;
      const row = await tx.authToken.findUnique({ where: { tokenHash }, select: { userId: true } });
      return row?.userId ?? null;
    });
  }
}
