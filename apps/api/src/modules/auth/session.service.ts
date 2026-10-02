import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';

import type { RequestMeta } from '../../common/http/request-context.js';
import { generateToken, hashToken, isWellFormedToken } from '../../common/utils/tokens.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { AUTH_USER_SELECT, type AuthContext } from './auth.types.js';

/** Avoid a database write on every request: refresh last_seen_at at most this often. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export interface CreatedSession {
  readonly token: string;
  readonly sessionId: string;
  readonly expiresAt: Date;
}

/**
 * Server-side sessions. The browser holds a random 256-bit token in an HttpOnly cookie;
 * the database stores only its SHA-256 hash. Sessions can be revoked at any time
 * (logout, password reset, account disabled) and are bound to the host they were
 * created on, so a cookie can never be replayed against another school or the platform.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly system: SystemDatabase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async create(input: {
    userId: string;
    host: string;
    meta: RequestMeta;
    activeSchoolId?: string | null;
  }): Promise<CreatedSession> {
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.session.ttlMs);
    const session = await this.system.client.session.create({
      data: {
        userId: input.userId,
        tokenHash: hashToken(token),
        host: input.host,
        activeSchoolId: input.activeSchoolId ?? null,
        ipAddress: input.meta.ipAddress,
        userAgent: input.meta.userAgent,
        createdAt: now,
        lastSeenAt: now,
        expiresAt,
      },
      select: { id: true },
    });
    return { token, sessionId: session.id, expiresAt };
  }

  /** Returns the session for `token` if it is valid for a request on `hostname`. */
  async authenticate(token: string | undefined, hostname: string): Promise<AuthContext | null> {
    if (!token || !isWellFormedToken(token)) return null;
    const session = await this.system.client.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        host: true,
        activeSchoolId: true,
        lastSeenAt: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: AUTH_USER_SELECT },
      },
    });
    if (!session || session.revokedAt) return null;

    const now = Date.now();
    if (session.expiresAt.getTime() <= now) return null;
    if (session.lastSeenAt.getTime() + this.config.session.idleTimeoutMs <= now) return null;
    if (session.host !== hostname) return null;
    if (session.user.status !== 'active') return null;

    if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.system.client.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date(now) },
        select: { id: true },
      });
    }

    return {
      sessionId: session.id,
      userId: session.user.id,
      user: session.user,
      host: session.host,
      activeSchoolId: session.activeSchoolId,
      expiresAt: session.expiresAt,
    };
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await this.system.client.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeToken(token: string, reason: string): Promise<void> {
    if (!isWellFormedToken(token)) return;
    await this.system.client.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async setActiveSchool(sessionId: string, schoolId: string | null): Promise<void> {
    await this.system.client.session.update({
      where: { id: sessionId },
      data: { activeSchoolId: schoolId },
      select: { id: true },
    });
  }

  readToken(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[this.config.session.cookieName];
    return typeof value === 'string' ? value : undefined;
  }

  setCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(this.config.session.cookieName, token, { ...this.cookieOptions(), expires: expiresAt });
  }

  clearCookie(res: Response): void {
    res.clearCookie(this.config.session.cookieName, this.cookieOptions());
  }

  /** Host-only (no Domain), HttpOnly, SameSite=Lax. Use the __Host- prefix in production. */
  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.session.secure, sameSite: 'lax', path: '/' };
  }
}
