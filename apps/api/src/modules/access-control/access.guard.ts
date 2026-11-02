import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AppError } from '../../common/errors/app-error.js';
import { requestContext } from '../../common/http/request-context.js';
import { SessionService } from '../auth/session.service.js';
import { PlatformAccessService } from '../platform/platform-access.service.js';
import { HostResolverService } from '../tenancy/host-resolver.service.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import type { HostContext } from '../tenancy/tenancy.types.js';
import { Access } from './access-policy.js';
import { assertSameOrigin } from './csrf.js';

/**
 * The single global guard implementing the request pipeline:
 *
 *   host resolution -> CSRF check -> authentication -> tenant resolution -> authorisation
 *
 * Each step derives identity from server-side state only (database-verified host,
 * session cookie, membership rows). The resolved context is attached to the request
 * for the @CurrentHost/@CurrentAuth/@CurrentTenant/@CurrentPlatform decorators.
 * Validation (pipes) runs after guards, so unauthenticated requests are rejected first.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly hosts: HostResolverService,
    private readonly sessions: SessionService,
    private readonly tenants: TenantResolverService,
    private readonly platform: PlatformAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const policy = this.reflector.getAllAndOverride(Access, [context.getHandler(), context.getClass()]);
    if (!policy) throw new Error(`No access policy on ${context.getClass().name}.${context.getHandler().name}`);

    const req = context.switchToHttp().getRequest<Request>();
    const ctx = requestContext(req);

    const host = await this.hosts.resolve(req.hostname);
    ctx.host = host;
    if (policy.kind === 'public' && policy.anyHost) return true;
    assertRecognisedHost(host);
    assertSameOrigin(req, host.hostname);
    if (policy.kind === 'public') return true;

    const auth = await this.sessions.authenticate(this.sessions.readToken(req), host.hostname);
    if (!auth) throw AppError.unauthenticated();
    ctx.auth = auth;
    if (policy.kind === 'authenticated') return true;

    if (policy.kind === 'platform') {
      if (host.kind !== 'platform') {
        throw AppError.forbidden('PLATFORM_ACCESS_DENIED', 'Platform administration is only available on the platform host');
      }
      const platform = await this.platform.find(auth.userId);
      if (!platform) throw AppError.forbidden('PLATFORM_ACCESS_DENIED', 'This account is not platform staff');
      if (!platform.permissions.hasAll(policy.permissions)) {
        throw AppError.forbidden('PERMISSION_DENIED', 'You do not have permission to do this', {
          required: [...policy.permissions],
        });
      }
      ctx.platform = platform;
      return true;
    }

    const tenant = await this.tenants.resolve(host, auth);
    ctx.tenant = tenant;
    if (!tenant.permissions.hasAll(policy.permissions)) {
      throw AppError.forbidden('PERMISSION_DENIED', 'You do not have permission to do this', {
        required: [...policy.permissions],
      });
    }
    return true;
  }
}

function assertRecognisedHost(host: HostContext): asserts host is Exclude<HostContext, { kind: 'unknown' }> {
  if (host.kind !== 'unknown') return;
  if (host.reason === 'school_not_found') throw AppError.notFound('SCHOOL_NOT_FOUND', 'No school uses this address');
  throw AppError.notFound('HOST_NOT_RECOGNIZED', 'This address is not a EduFlow site');
}
