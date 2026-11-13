import { Inject, Injectable } from '@nestjs/common';
import {
  isLocale,
  type LoginInput,
  type ResetPasswordInput,
  type SessionContextDto,
  type SignupInput,
  type UserDto,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { MailService } from '../../infrastructure/mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { PlatformAccessService } from '../platform/platform-access.service.js';
import { linkOrigin } from '../tenancy/school-urls.js';
import { hostKind, toTenantContextDto } from '../tenancy/tenancy.mappers.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import type { HostContext } from '../tenancy/tenancy.types.js';
import { AuthTokenService } from './auth-token.service.js';
import { AUTH_USER_SELECT, type AuthContext, type AuthUser } from './auth.types.js';
import { LoginThrottleService } from './login-throttle.service.js';
import { PasswordService } from './password.service.js';
import { SessionService, type CreatedSession } from './session.service.js';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Account lifecycle: sign-up, email verification, sign-in, sign-out and password reset.
 *
 * Responses never reveal whether an email is registered: sign-up, resend and
 * forgot-password always answer the same way, and sign-in failures share one error.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly system: SystemDatabase,
    private readonly sessions: SessionService,
    private readonly passwords: PasswordService,
    private readonly tokens: AuthTokenService,
    private readonly throttle: LoginThrottleService,
    private readonly tenants: TenantResolverService,
    private readonly platformAccess: PlatformAccessService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async signup(input: SignupInput, host: HostContext, meta: RequestMeta): Promise<void> {
    // Hash first so new and existing emails take the same time.
    const passwordHash = await this.passwords.hash(input.password);
    const origin = linkOrigin(this.config, host);

    const existing = await this.system.client.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, locale: true, emailVerifiedAt: true },
    });
    if (existing) {
      if (existing.emailVerifiedAt) {
        await this.mail.send({
          to: input.email,
          template: 'accountExists',
          locale: existing.locale,
          name: existing.name,
          url: `${origin}/login`,
        });
      } else {
        await this.sendVerification(existing.id, input.email, existing.name, existing.locale, origin);
      }
      return;
    }

    let user: { id: string };
    try {
      user = await this.system.client.user.create({
        data: {
          email: input.email,
          name: input.name,
          locale: input.locale ?? null,
          credential: { create: { passwordHash } },
        },
        select: { id: true },
      });
    } catch (error) {
      if (isUniqueViolation(error, 'email')) return; // concurrent sign-up with the same email
      throw error;
    }

    await this.audit.recordSystem(
      { action: 'user.signed_up', entityType: 'user', entityId: user.id, actorUserId: user.id },
      meta,
    );
    await this.sendVerification(user.id, input.email, input.name, input.locale ?? null, origin);
  }

  async login(
    input: LoginInput,
    host: HostContext,
    meta: RequestMeta,
  ): Promise<{ session: CreatedSession; auth: AuthContext }> {
    await this.throttle.assertNotLocked(input.email);

    const user = await this.system.client.user.findUnique({
      where: { email: input.email },
      select: { ...AUTH_USER_SELECT, credential: { select: { passwordHash: true } } },
    });
    const valid = user?.credential
      ? await this.passwords.verify(user.credential.passwordHash, input.password)
      : await this.passwords.verifyAgainstDummy(input.password);

    if (!user?.credential || !valid) {
      await this.throttle.recordFailure(input.email);
      throw AppError.unauthenticated('INVALID_CREDENTIALS', 'Email or password is incorrect');
    }
    await this.throttle.reset(input.email);

    // Only reached with the correct password, so these do not leak account existence.
    if (user.status !== 'active') throw AppError.forbidden('ACCOUNT_DISABLED', 'This account has been disabled');
    if (!user.emailVerifiedAt) {
      throw AppError.forbidden('EMAIL_NOT_VERIFIED', 'Verify your email address before signing in');
    }
    if (host.kind === 'school') {
      await this.system.client.schoolMembership.updateMany({
        where: { schoolId: host.school.id, userId: user.id, status: 'invited' },
        data: { status: 'active' },
      });
    }
    await this.assertHostAccess(host, user.id);

    if (this.passwords.needsRehash(user.credential.passwordHash)) {
      await this.system.client.userCredential.update({
        where: { userId: user.id },
        data: { passwordHash: await this.passwords.hash(input.password) },
        select: { userId: true },
      });
    }

    const session = await this.sessions.create({ userId: user.id, host: host.hostname, meta });
    await this.system.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });
    await this.audit.recordSystem(
      {
        action: 'auth.signed_in',
        entityType: 'session',
        entityId: session.sessionId,
        actorUserId: user.id,
        schoolId: host.kind === 'school' ? host.school.id : null,
        metadata: { host: host.hostname },
      },
      meta,
    );

    const { credential: _credential, ...authUser } = user;
    return {
      session,
      auth: {
        sessionId: session.sessionId,
        userId: user.id,
        user: authUser,
        host: host.hostname,
        activeSchoolId: null,
        expiresAt: session.expiresAt,
      },
    };
  }

  async logout(auth: AuthContext, meta: RequestMeta): Promise<void> {
    await this.sessions.revoke(auth.sessionId, 'logout');
    await this.audit.recordSystem(
      { action: 'auth.signed_out', entityType: 'session', entityId: auth.sessionId, actorUserId: auth.userId },
      meta,
    );
  }

  async verifyEmail(token: string, meta: RequestMeta): Promise<void> {
    const userId = await this.tokens.consume(token, 'email_verification');
    if (!userId) throw AppError.badRequest('TOKEN_INVALID', 'This link is invalid or has expired');
    await this.system.client.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    await this.audit.recordSystem(
      { action: 'auth.email_verified', entityType: 'user', entityId: userId, actorUserId: userId },
      meta,
    );
  }

  async resendVerification(email: string, host: HostContext): Promise<void> {
    const user = await this.system.client.user.findUnique({
      where: { email },
      select: { id: true, name: true, locale: true, status: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt || user.status !== 'active') return;
    await this.sendVerification(user.id, email, user.name, user.locale, linkOrigin(this.config, host));
  }

  async forgotPassword(email: string, host: HostContext, meta: RequestMeta): Promise<void> {
    const user = await this.system.client.user.findUnique({
      where: { email },
      select: { id: true, name: true, locale: true, status: true },
    });
    if (!user || user.status !== 'active') return;
    const token = await this.tokens.issue(user.id, 'password_reset', PASSWORD_RESET_TTL_MS);
    await this.mail.send({
      to: email,
      template: 'passwordReset',
      locale: user.locale,
      name: user.name,
      url: `${linkOrigin(this.config, host)}/reset-password?token=${token}`,
    });
    await this.audit.recordSystem(
      { action: 'auth.password_reset_requested', entityType: 'user', entityId: user.id, actorUserId: user.id },
      meta,
    );
  }

  /** Sets a new password, signs the user out everywhere and confirms their email. */
  async resetPassword(input: ResetPasswordInput, meta: RequestMeta): Promise<void> {
    const userId = await this.tokens.consume(input.token, 'password_reset');
    if (!userId) throw AppError.badRequest('TOKEN_INVALID', 'This link is invalid or has expired');

    const passwordHash = await this.passwords.hash(input.password);
    const db = this.system.client;
    const now = new Date();
    await db.$transaction([
      db.userCredential.upsert({
        where: { userId },
        create: { userId, passwordHash },
        update: { passwordHash, passwordChangedAt: now },
        select: { userId: true },
      }),
      // Following the emailed link proves ownership of the address.
      db.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: now } }),
      // Activating any pending school invitations for this user.
      db.schoolMembership.updateMany({
        where: { userId, status: 'invited' },
        data: { status: 'active' },
      }),
      db.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'password_reset' },
      }),
    ]);
    await this.audit.recordSystem(
      { action: 'auth.password_reset', entityType: 'user', entityId: userId, actorUserId: userId },
      meta,
    );
  }

  /** Selects the active school for a session on the account host, after verifying membership. */
  async switchSchool(auth: AuthContext, host: HostContext, schoolId: string): Promise<SessionContextDto> {
    if (host.kind !== 'root') {
      throw AppError.badRequest(
        'VALIDATION_FAILED',
        "The active school can only be changed on the account host; open the school's own address instead",
      );
    }
    await this.system.client.schoolMembership.updateMany({
      where: { schoolId, userId: auth.userId, status: 'invited' },
      data: { status: 'active' },
    });
    const tenant = await this.tenants.load(schoolId, auth.userId);
    if (!tenant) throw AppError.forbidden('TENANT_ACCESS_DENIED', 'You are not a member of this school');
    await this.sessions.setActiveSchool(auth.sessionId, schoolId);
    return this.sessionContext({ ...auth, activeSchoolId: schoolId }, host);
  }

  /** Everything the web app needs to render for the signed-in user on this host. */
  async sessionContext(auth: AuthContext, host: HostContext): Promise<SessionContextDto> {
    const schoolId = host.kind === 'school' ? host.school.id : host.kind === 'root' ? auth.activeSchoolId : null;
    const tenant = schoolId ? await this.tenants.load(schoolId, auth.userId).catch(ignoreTenantErrors) : null;
    const platform = host.kind === 'platform' ? await this.platformAccess.find(auth.userId) : null;

    return {
      user: toUserDto(auth.user),
      host: hostKind(host),
      session: { id: auth.sessionId, expiresAt: auth.expiresAt.toISOString() },
      tenant: tenant ? toTenantContextDto(this.config, tenant) : null,
      platform: platform ? { roles: [...platform.roles], permissions: platform.permissions.toArray().map((grant) => grant.key) } : null,
    };
  }

  private async assertHostAccess(host: HostContext, userId: string): Promise<void> {
    switch (host.kind) {
      case 'school': {
        const tenant = await this.tenants.load(host.school.id, userId);
        if (!tenant) throw AppError.forbidden('TENANT_ACCESS_DENIED', `You are not a member of ${host.school.name}`);
        return;
      }
      case 'platform': {
        const platform = await this.platformAccess.find(userId);
        if (!platform) throw AppError.forbidden('PLATFORM_ACCESS_DENIED', 'This account is not platform staff');
        return;
      }
      case 'root':
        return;
      case 'unknown':
        throw AppError.notFound('HOST_NOT_RECOGNIZED', 'This address is not a EduFlow site');
    }
  }

  private async sendVerification(
    userId: string,
    email: string,
    name: string,
    locale: string | null,
    origin: string,
  ): Promise<void> {
    const token = await this.tokens.issue(userId, 'email_verification', EMAIL_VERIFICATION_TTL_MS);
    await this.mail.send({
      to: email,
      template: 'verifyEmail',
      locale,
      name,
      url: `${origin}/verify-email?token=${token}`,
    });
  }
}

function ignoreTenantErrors(error: unknown): null {
  if (error instanceof AppError && error.code === 'SCHOOL_SUSPENDED') return null;
  throw error;
}

function toUserDto(user: AuthUser): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    locale: isLocale(user.locale) ? user.locale : null,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
