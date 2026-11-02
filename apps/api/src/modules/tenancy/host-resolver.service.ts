import { Inject, Injectable } from '@nestjs/common';
import { classifyHost } from '@eduflow/types';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import type { HostContext, HostSchool } from './tenancy.types.js';

const CACHE_TTL_MS = 30_000;
const NEGATIVE_CACHE_TTL_MS = 5_000;

interface CacheEntry {
  readonly school: HostSchool | null;
  readonly expiresAt: number;
}

/**
 * TenantResolver, step 1: maps the request hostname to a school.
 *
 *   admin.<base>          -> platform administration
 *   APP_ROOT_HOSTS        -> account host (sign-in, school picker)
 *   <slug>.<base>         -> school by slug
 *   anything else         -> school by verified custom domain
 *
 * This is the only place that interprets hostnames; never parse hosts elsewhere. It
 * runs before authentication, so it uses the system database and returns public
 * school facts only. Lookups are cached briefly per process.
 */
@Injectable()
export class HostResolverService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly system: SystemDatabase,
  ) {}

  async resolve(rawHost: string | undefined): Promise<HostContext> {
    const host = classifyHost(rawHost, this.config.hosts);
    switch (host.kind) {
      case 'root':
      case 'platform':
        return { kind: host.kind, hostname: host.hostname };
      case 'subdomain': {
        const school = await this.cached(`slug:${host.slug}`, () => this.findBySlug(host.slug));
        return school
          ? { kind: 'school', hostname: host.hostname, school, via: 'subdomain' }
          : { kind: 'unknown', hostname: host.hostname, reason: 'school_not_found' };
      }
      case 'custom-domain': {
        const school = await this.cached(`domain:${host.hostname}`, () => this.findByDomain(host.hostname));
        return school
          ? { kind: 'school', hostname: host.hostname, school, via: 'custom-domain' }
          : { kind: 'unknown', hostname: host.hostname, reason: 'school_not_found' };
      }
      case 'invalid':
        return { kind: 'unknown', hostname: host.hostname, reason: 'invalid' };
    }
  }

  /** Drops cached lookups, e.g. after a school's slug, domain or status changes. */
  invalidate(): void {
    this.cache.clear();
  }

  private async cached(key: string, load: () => Promise<HostSchool | null>): Promise<HostSchool | null> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.school;
    const school = await load();
    this.cache.set(key, { school, expiresAt: Date.now() + (school ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS) });
    return school;
  }

  private findBySlug(slug: string): Promise<HostSchool | null> {
    return this.system.client.school.findUnique({ where: { slug }, select: HOST_SCHOOL_SELECT });
  }

  private async findByDomain(domain: string): Promise<HostSchool | null> {
    const row = await this.system.client.schoolDomain.findUnique({
      where: { domain },
      select: { verifiedAt: true, school: { select: HOST_SCHOOL_SELECT } },
    });
    return row?.verifiedAt ? row.school : null;
  }
}

const HOST_SCHOOL_SELECT = {
  id: true,
  slug: true,
  name: true,
  status: true,
  defaultLocale: true,
} as const;
