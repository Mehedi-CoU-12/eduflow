import { isValidSchoolSlug } from '../schools/slug.js';

/**
 * Hostname classification shared by the API (TenantResolver) and the web app (proxy).
 *
 * It only parses the hostname. Whether a subdomain or custom domain belongs to a real
 * school is decided by the API, which looks it up in the database.
 */
export interface HostConfig {
  /** School subdomains live under this domain: `<slug>.<baseDomain>`. */
  readonly baseDomain: string;
  /** Account hosts with no school in the URL (sign-in, school picker). */
  readonly rootHosts: readonly string[];
  /** Hosts that serve the platform administration area. */
  readonly platformHosts: readonly string[];
}

export type HostClassification =
  | { readonly kind: 'root'; readonly hostname: string }
  | { readonly kind: 'platform'; readonly hostname: string }
  | { readonly kind: 'subdomain'; readonly hostname: string; readonly slug: string }
  | { readonly kind: 'custom-domain'; readonly hostname: string }
  | { readonly kind: 'invalid'; readonly hostname: string };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Lowercases a Host header value and strips the port and any trailing dot.
 * Returns null when the value is not a plausible DNS hostname (IP literals included).
 */
export function normalizeHostname(rawHost: string | undefined | null): string | null {
  if (!rawHost) return null;
  let host = rawHost.trim().toLowerCase();
  if (host.startsWith('[')) return null; // IPv6 literal
  const colon = host.lastIndexOf(':');
  if (colon !== -1) {
    const port = host.slice(colon + 1);
    if (!/^\d{1,5}$/.test(port)) return null;
    host = host.slice(0, colon);
  }
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.length === 0 || host.length > 253) return null;
  const labels = host.split('.');
  if (!labels.every((label) => LABEL.test(label))) return null;
  if (labels.every((label) => /^\d+$/.test(label))) return null; // IPv4 literal
  return host;
}

export function classifyHost(rawHost: string | undefined | null, config: HostConfig): HostClassification {
  const hostname = normalizeHostname(rawHost);
  if (!hostname) return { kind: 'invalid', hostname: rawHost ?? '' };

  if (config.platformHosts.includes(hostname)) return { kind: 'platform', hostname };
  if (config.rootHosts.includes(hostname)) return { kind: 'root', hostname };

  const base = config.baseDomain.toLowerCase();
  if (hostname === base) return { kind: 'invalid', hostname };

  const suffix = `.${base}`;
  if (hostname.endsWith(suffix)) {
    const label = hostname.slice(0, -suffix.length);
    // Only single-label subdomains are school hosts; reserved labels are never schools.
    if (!label.includes('.') && isValidSchoolSlug(label)) {
      return { kind: 'subdomain', hostname, slug: label };
    }
    return { kind: 'invalid', hostname };
  }

  return { kind: 'custom-domain', hostname };
}

/** Builds the public URL of a school subdomain from the platform's public URL. */
export function schoolSubdomainUrl(publicUrl: string, baseDomain: string, slug: string): string {
  const url = new URL(publicUrl);
  url.hostname = `${slug}.${baseDomain}`;
  url.pathname = '/';
  return url.origin;
}
