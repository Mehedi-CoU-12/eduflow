import {
  PLATFORM_PERMISSION_KEYS,
  SCHOOL_PERMISSION_KEYS,
  maxScopeOf,
  type PermissionKey,
  type PermissionScope,
  type PlatformPermissionKey,
  type Realm,
  type SchoolPermissionKey,
} from './permissions.js';

/**
 * Built-in role templates. System roles are global rows (`roles.school_id IS NULL`)
 * shared by every school; schools add their own custom roles on top.
 *
 * Like the permission catalog, these definitions are synced into the database at
 * startup. The sync only adds grants — revoking a grant from a system role needs a
 * migration, so a rolling deploy can never flap permissions.
 */
export interface SystemRoleDefinition<K extends PermissionKey = PermissionKey> {
  readonly realm: Realm;
  readonly name: string;
  readonly description: string;
  readonly grants: Readonly<Partial<Record<K, PermissionScope>>>;
}

function grantAll<K extends PermissionKey>(
  keys: readonly K[],
  except: readonly K[] = [],
): Partial<Record<K, PermissionScope>> {
  return Object.fromEntries(
    keys.filter((key) => !except.includes(key)).map((key) => [key, maxScopeOf(key)]),
  ) as Partial<Record<K, PermissionScope>>;
}

export const SCHOOL_SYSTEM_ROLES = {
  school_owner: {
    realm: 'school',
    name: 'School Owner',
    description: 'Full control of the school, including its subscription.',
    grants: grantAll(SCHOOL_PERMISSION_KEYS),
  },
  school_admin: {
    realm: 'school',
    name: 'School Admin',
    description: 'Runs the school day to day. Cannot manage the subscription.',
    grants: grantAll(SCHOOL_PERMISSION_KEYS, ['subscription.manage']),
  },
  accountant: {
    realm: 'school',
    name: 'Accountant',
    description: 'Manages fees, invoices, payments and refunds.',
    grants: {
      'school.view': 'all',
      'academics.view': 'all',
      'students.view': 'all',
      'fees.view': 'all',
      'fees.create': 'all',
      'fees.collect': 'all',
      'fees.refund': 'all',
    },
  },
  teacher: {
    realm: 'school',
    name: 'Teacher',
    description: 'Teaches assigned sections; sees only their own classes and students.',
    grants: {
      'school.view': 'all',
      'academics.view': 'assigned',
      'students.view': 'assigned',
      'attendance.view': 'assigned',
      'attendance.mark': 'assigned',
      'results.view': 'assigned',
      'results.enter': 'assigned',
    },
  },
  student: {
    realm: 'school',
    name: 'Student',
    description: 'Student portal access to their own records.',
    grants: {
      'school.view': 'all',
      'academics.view': 'own',
      'students.view': 'own',
      'attendance.view': 'own',
      'results.view': 'own',
    },
  },
  guardian: {
    realm: 'school',
    name: 'Parent/Guardian',
    description: "Parent portal access to their children's records.",
    grants: {
      'school.view': 'all',
      'academics.view': 'own',
      'students.view': 'own',
      'attendance.view': 'own',
      'results.view': 'own',
      'fees.view': 'own',
    },
  },
  librarian: {
    realm: 'school',
    name: 'Librarian',
    description: 'Runs the library; can look up students.',
    grants: {
      'school.view': 'all',
      'academics.view': 'all',
      'students.view': 'all',
    },
  },
  hr_staff: {
    realm: 'school',
    name: 'HR/Staff',
    description: 'Manages staff records.',
    grants: {
      'school.view': 'all',
      'users.view': 'all',
    },
  },
} as const satisfies Record<string, SystemRoleDefinition<SchoolPermissionKey>>;

export const PLATFORM_SYSTEM_ROLES = {
  platform_owner: {
    realm: 'platform',
    name: 'Platform Owner',
    description: 'Operates the EduFlow platform.',
    grants: grantAll(PLATFORM_PERMISSION_KEYS),
  },
} as const satisfies Record<string, SystemRoleDefinition<PlatformPermissionKey>>;

export type SchoolSystemRoleKey = keyof typeof SCHOOL_SYSTEM_ROLES;
export type PlatformSystemRoleKey = keyof typeof PLATFORM_SYSTEM_ROLES;
export type SystemRoleKey = SchoolSystemRoleKey | PlatformSystemRoleKey;

export const SYSTEM_ROLES: Record<SystemRoleKey, SystemRoleDefinition> = {
  ...SCHOOL_SYSTEM_ROLES,
  ...PLATFORM_SYSTEM_ROLES,
};

export const SYSTEM_ROLE_KEYS = Object.keys(SYSTEM_ROLES) as SystemRoleKey[];
