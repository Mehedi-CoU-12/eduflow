import type { Request } from 'express';

import type { AuthContext } from '../../modules/auth/auth.types.js';
import type { PlatformContext } from '../../modules/platform/platform.types.js';
import type { TenantContext } from '../../modules/tenancy/tenant-context.js';
import type { HostContext } from '../../modules/tenancy/tenancy.types.js';

/**
 * Server-derived identity for the current request, filled in by AccessGuard.
 * Nothing here ever comes from client-supplied ids: the host is resolved against the
 * database, the user from the session cookie, and the tenant from verified membership.
 */
export interface RequestContext {
  host?: HostContext;
  auth?: AuthContext;
  tenant?: TenantContext;
  platform?: PlatformContext;
}

export type AppRequest = Request & { context: RequestContext };

/** Client metadata recorded with audit entries. */
export interface RequestMeta {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly requestId: string | null;
}

export function requestContext(req: Request): RequestContext {
  const appReq = req as AppRequest;
  appReq.context ??= {};
  return appReq.context;
}

export function requestMeta(req: Request): RequestMeta {
  const userAgent = req.get('user-agent');
  const id = (req as Request & { id?: unknown }).id;
  return {
    ipAddress: req.ip ?? null,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
    requestId: typeof id === 'string' ? id : null,
  };
}
