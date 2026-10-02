import type { SchoolStatus } from '@shikkhacore/types';

/** Public facts about the school a host belongs to. */
export interface HostSchool {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: SchoolStatus;
  readonly defaultLocale: string;
}

/** What the request hostname resolves to. Computed by HostResolverService. */
export type HostContext =
  | { readonly kind: 'root'; readonly hostname: string }
  | { readonly kind: 'platform'; readonly hostname: string }
  | {
      readonly kind: 'school';
      readonly hostname: string;
      readonly school: HostSchool;
      readonly via: 'subdomain' | 'custom-domain';
    }
  | { readonly kind: 'unknown'; readonly hostname: string; readonly reason: 'invalid' | 'school_not_found' };
