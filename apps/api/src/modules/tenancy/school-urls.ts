import { schoolSubdomainUrl } from '@shikkhacore/types';

import type { AppConfig } from '../../config/env.js';
import type { HostContext } from './tenancy.types.js';

export function schoolUrl(config: AppConfig, slug: string): string {
  return schoolSubdomainUrl(config.hosts.publicUrl, config.hosts.baseDomain, slug);
}

/**
 * Origin for links in emails sent from a request on `host`, so a school's users land on
 * their school's branded pages.
 *
 * The Host header is only trusted after HostResolverService has matched it against
 * configuration or the database, which prevents host-header poisoning of reset links.
 * Custom domains fall back to the school's subdomain: their DNS is controlled by the
 * school, not by us, and must never receive single-use tokens.
 */
export function linkOrigin(config: AppConfig, host: HostContext): string {
  if (host.kind === 'unknown') return new URL(config.hosts.publicUrl).origin;
  if (host.kind === 'school' && host.via === 'custom-domain') return schoolUrl(config, host.school.slug);
  const url = new URL(config.hosts.publicUrl);
  url.hostname = host.hostname;
  return url.origin;
}
