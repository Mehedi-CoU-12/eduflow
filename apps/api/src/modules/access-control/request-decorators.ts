import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { requestContext, requestMeta, type RequestContext } from '../../common/http/request-context.js';

function fromContext<K extends keyof RequestContext>(key: K) {
  return createParamDecorator((_data: unknown, ctx: ExecutionContext): NonNullable<RequestContext[K]> => {
    const value = requestContext(ctx.switchToHttp().getRequest<Request>())[key];
    // AccessGuard fills these in according to the route's access policy. A missing value
    // means the decorator is used on a route whose policy does not provide it.
    if (value === undefined) throw new Error(`Request context "${key}" is not available for this route`);
    return value;
  });
}

/** The resolved host (root, platform or school). Available on every route. */
export const CurrentHost = fromContext('host');

/** The signed-in session. Requires @Authenticated, @TenantMember or a permission policy. */
export const CurrentAuth = fromContext('auth');

/** The verified school context. Requires @TenantMember or @RequirePermissions. */
export const CurrentTenant = fromContext('tenant');

/** The platform staff context. Requires @RequirePlatformPermissions. */
export const CurrentPlatform = fromContext('platform');

/** Client IP, user agent and request id, for audit entries. */
export const ReqMeta = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  requestMeta(ctx.switchToHttp().getRequest<Request>()),
);
