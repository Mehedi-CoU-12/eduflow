/**
 * Permission catalog — the single source of truth for every permission key.
 *
 * The API syncs this catalog into the `permissions` table at startup (additive only),
 * so adding a permission is a code change. Removing one requires a migration.
 *
 * A permission belongs to a realm:
 *   - `school`   — granted through a school role, evaluated inside a school (tenant) context.
 *   - `platform` — granted through a platform role, evaluated on the platform admin host.
 *
 * School permissions are granted with a data scope (see PERMISSION_SCOPES); `scopes`
 * lists the scopes that make sense for that permission.
 */

export const REALMS = ['school', 'platform'] as const;
export type Realm = (typeof REALMS)[number];

/**
 * How much data a granted permission reaches. Each module defines the concrete meaning:
 *   own      — records about the user themself (a student) or their children (a guardian).
 *   assigned — records linked to the user's assignments (a teacher's sections and subjects).
 *   all      — every record in the school.
 */
export const PERMISSION_SCOPES = ['own', 'assigned', 'all'] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** Broader scopes rank higher; the effective scope across several roles is the maximum. */
export const PERMISSION_SCOPE_RANK: Record<PermissionScope, number> = {
  own: 1,
  assigned: 2,
  all: 3,
};

export interface PermissionDefinition {
  readonly realm: Realm;
  /** Grouping used by role editors and documentation. */
  readonly module: string;
  readonly description: string;
  /** Scopes that may be granted for this permission. */
  readonly scopes: readonly PermissionScope[];
}

const ALL = ['all'] as const;
const ASSIGNED_OR_ALL = ['assigned', 'all'] as const;
const ANY_SCOPE = ['own', 'assigned', 'all'] as const;
const OWN_OR_ALL = ['own', 'all'] as const;

export const PERMISSIONS = {
  // School profile and SaaS account
  'school.view': {
    realm: 'school',
    module: 'school',
    description: 'View the school profile and settings',
    scopes: ALL,
  },
  'school.update': {
    realm: 'school',
    module: 'school',
    description: 'Update the school profile, branding and settings',
    scopes: ALL,
  },
  'subscription.manage': {
    realm: 'school',
    module: 'school',
    description: "Manage the school's ShikkhaCore subscription and billing",
    scopes: ALL,
  },

  // Users, roles and audit
  'users.view': {
    realm: 'school',
    module: 'users',
    description: 'View school members',
    scopes: ALL,
  },
  'users.invite': {
    realm: 'school',
    module: 'users',
    description: 'Invite people to the school',
    scopes: ALL,
  },
  'users.update': {
    realm: 'school',
    module: 'users',
    description: 'Update school memberships',
    scopes: ALL,
  },
  'users.remove': {
    realm: 'school',
    module: 'users',
    description: 'Remove people from the school',
    scopes: ALL,
  },
  'roles.view': {
    realm: 'school',
    module: 'roles',
    description: 'View roles and their permissions',
    scopes: ALL,
  },
  'roles.manage': {
    realm: 'school',
    module: 'roles',
    description: 'Create and edit custom roles',
    scopes: ALL,
  },
  'roles.assign': {
    realm: 'school',
    module: 'roles',
    description: 'Assign roles to school members',
    scopes: ALL,
  },
  'audit.view': {
    realm: 'school',
    module: 'audit',
    description: "View the school's audit log",
    scopes: ALL,
  },

  // Students
  'students.view': {
    realm: 'school',
    module: 'students',
    description: 'View student profiles',
    scopes: ANY_SCOPE,
  },
  'students.create': {
    realm: 'school',
    module: 'students',
    description: 'Admit and create students',
    scopes: ALL,
  },
  'students.update': {
    realm: 'school',
    module: 'students',
    description: 'Update student profiles',
    scopes: ASSIGNED_OR_ALL,
  },
  'students.archive': {
    realm: 'school',
    module: 'students',
    description: 'Archive students',
    scopes: ALL,
  },

  // Attendance
  'attendance.view': {
    realm: 'school',
    module: 'attendance',
    description: 'View attendance records',
    scopes: ANY_SCOPE,
  },
  'attendance.mark': {
    realm: 'school',
    module: 'attendance',
    description: 'Mark attendance',
    scopes: ASSIGNED_OR_ALL,
  },
  'attendance.edit': {
    realm: 'school',
    module: 'attendance',
    description: 'Edit attendance after it has been saved',
    scopes: ASSIGNED_OR_ALL,
  },

  // Results
  'results.view': {
    realm: 'school',
    module: 'results',
    description: 'View marks and results',
    scopes: ANY_SCOPE,
  },
  'results.enter': {
    realm: 'school',
    module: 'results',
    description: 'Enter marks',
    scopes: ASSIGNED_OR_ALL,
  },
  'results.edit': {
    realm: 'school',
    module: 'results',
    description: 'Edit marks after entry',
    scopes: ASSIGNED_OR_ALL,
  },
  'results.publish': {
    realm: 'school',
    module: 'results',
    description: 'Publish results to students and guardians',
    scopes: ALL,
  },

  // Fees
  'fees.view': {
    realm: 'school',
    module: 'fees',
    description: 'View invoices, payments and balances',
    scopes: OWN_OR_ALL,
  },
  'fees.create': {
    realm: 'school',
    module: 'fees',
    description: 'Create fee structures and invoices',
    scopes: ALL,
  },
  'fees.collect': {
    realm: 'school',
    module: 'fees',
    description: 'Record payments',
    scopes: ALL,
  },
  'fees.refund': {
    realm: 'school',
    module: 'fees',
    description: 'Issue refunds',
    scopes: ALL,
  },

  // Platform administration
  'platform.schools.view': {
    realm: 'platform',
    module: 'platform',
    description: 'View all schools on the platform',
    scopes: ALL,
  },
  'platform.schools.manage': {
    realm: 'platform',
    module: 'platform',
    description: 'Suspend, reactivate and configure schools',
    scopes: ALL,
  },
  'platform.users.view': {
    realm: 'platform',
    module: 'platform',
    description: 'View all user accounts on the platform',
    scopes: ALL,
  },
  'platform.audit.view': {
    realm: 'platform',
    module: 'platform',
    description: 'View platform-wide audit activity',
    scopes: ALL,
  },
} as const satisfies Record<string, PermissionDefinition>;

export type PermissionKey = keyof typeof PERMISSIONS;

type KeysOfRealm<R extends Realm> = {
  [K in PermissionKey]: (typeof PERMISSIONS)[K]['realm'] extends R ? K : never;
}[PermissionKey];

export type SchoolPermissionKey = KeysOfRealm<'school'>;
export type PlatformPermissionKey = KeysOfRealm<'platform'>;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export const SCHOOL_PERMISSION_KEYS = PERMISSION_KEYS.filter(
  (key): key is SchoolPermissionKey => PERMISSIONS[key].realm === 'school',
);

export const PLATFORM_PERMISSION_KEYS = PERMISSION_KEYS.filter(
  (key): key is PlatformPermissionKey => PERMISSIONS[key].realm === 'platform',
);

export function isPermissionKey(value: string): value is PermissionKey {
  return Object.hasOwn(PERMISSIONS, value);
}

export function isSchoolPermissionKey(value: string): value is SchoolPermissionKey {
  return isPermissionKey(value) && PERMISSIONS[value].realm === 'school';
}

export function isPlatformPermissionKey(value: string): value is PlatformPermissionKey {
  return isPermissionKey(value) && PERMISSIONS[value].realm === 'platform';
}

/** The broadest scope a permission can be granted with. */
export function maxScopeOf(key: PermissionKey): PermissionScope {
  const scopes: readonly PermissionScope[] = PERMISSIONS[key].scopes;
  return scopes.reduce((best, scope) =>
    PERMISSION_SCOPE_RANK[scope] > PERMISSION_SCOPE_RANK[best] ? scope : best,
  );
}
