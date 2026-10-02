import { normalizeHostname } from '@shikkhacore/types';
import type { Request } from 'express';

import { AppError } from '../../common/errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated, state-changing requests.
 *
 * SameSite=Lax cookies are not enough on their own: every school subdomain shares the
 * registrable domain, so `evil.shikkhacore.com` counts as same-site. The API is served
 * same-origin with the web app (/api on the school's own host), so legitimate browser
 * requests are always same-origin:
 *
 *   1. Sec-Fetch-Site present -> must be "same-origin" (or "none" for user-initiated).
 *   2. Otherwise Origin present -> its hostname must equal the request hostname.
 *   3. Neither header -> not a browser request, so CSRF does not apply.
 */
export function assertSameOrigin(req: Request, hostname: string): void {
  if (SAFE_METHODS.has(req.method)) return;

  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite) {
    if (fetchSite === 'same-origin' || fetchSite === 'none') return;
    throw rejected();
  }

  const origin = req.get('origin');
  if (origin !== undefined) {
    let originHost: string | null = null;
    try {
      originHost = normalizeHostname(new URL(origin).host);
    } catch {
      originHost = null;
    }
    if (originHost && originHost === hostname) return;
    throw rejected();
  }
}

function rejected(): AppError {
  return AppError.forbidden('CSRF_REJECTED', 'Cross-site request rejected');
}
