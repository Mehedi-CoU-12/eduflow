/**
 * School slugs double as subdomains (`<slug>.shikkhacore.com`), so they follow DNS label
 * rules: 3–40 lowercase letters, digits and single hyphens, starting and ending with a
 * letter or digit. The database enforces the same pattern with a CHECK constraint.
 */
export const SCHOOL_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,38}[a-z0-9]$/;

/** Subdomains that must never resolve to a school. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'blog',
  'cdn',
  'dashboard',
  'demo',
  'dev',
  'docs',
  'email',
  'files',
  'ftp',
  'help',
  'internal',
  'login',
  'mail',
  'media',
  'ns1',
  'ns2',
  'platform',
  'root',
  'shikkhacore',
  'smtp',
  'staging',
  'static',
  'status',
  'support',
  'system',
  'test',
  'www',
]);

export function isValidSchoolSlug(slug: string): boolean {
  return SCHOOL_SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

/** Suggests a slug from a school name, e.g. "Greenfield School" → "greenfield-school". */
export function slugifySchoolName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
