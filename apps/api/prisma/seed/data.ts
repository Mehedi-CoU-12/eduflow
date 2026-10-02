import type { PermissionScope, SchoolPermissionKey, SchoolSystemRoleKey } from '@shikkhacore/types';

/**
 * Development seed dataset. Two schools with completely separate people, so that any
 * cross-tenant leak is obvious, plus one teacher who works at both schools.
 *
 * Every seeded account uses SEED_PASSWORD. Never run the seed against production.
 */
export const SEED_PASSWORD = 'Password123!';

export interface SeedPerson {
  readonly email: string;
  readonly name: string;
  readonly roles: readonly (SchoolSystemRoleKey | `custom:${string}`)[];
}

export interface SeedCustomRole {
  readonly name: string;
  readonly description: string;
  readonly grants: Partial<Record<SchoolPermissionKey, PermissionScope>>;
}

export interface SeedSchool {
  readonly slug: string;
  readonly name: string;
  readonly status: 'active' | 'suspended';
  readonly countryCode: string;
  readonly timezone: string;
  readonly currencyCode: string;
  readonly defaultLocale: 'en' | 'bn';
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly customDomain?: string;
  readonly customRoles: readonly SeedCustomRole[];
  readonly people: readonly SeedPerson[];
}

const FIRST_NAMES = [
  'Abdullah', 'Afsana', 'Arif', 'Ayesha', 'Fahim', 'Farzana', 'Habib', 'Ishrat', 'Jamal', 'Lamia',
  'Mahbub', 'Mithila', 'Nafis', 'Nasrin', 'Rafiq', 'Rumana', 'Sabbir', 'Sadia', 'Tahmid', 'Tasnim',
  'Imran', 'Shirin', 'Zahid', 'Rokeya', 'Shakil', 'Jannat', 'Mizanur', 'Sumaiya', 'Rakib', 'Mehnaz',
];
const LAST_NAMES = [
  'Ahmed', 'Akter', 'Alam', 'Begum', 'Chowdhury', 'Das', 'Hossain', 'Islam', 'Khan', 'Mahmud',
  'Miah', 'Rahman', 'Roy', 'Sarkar', 'Siddique', 'Talukder', 'Uddin', 'Bhuiyan', 'Karim', 'Sultana',
];

function personName(index: number, offset: number): string {
  const first = FIRST_NAMES[(index + offset) % FIRST_NAMES.length]!;
  const last = LAST_NAMES[(index * 7 + offset) % LAST_NAMES.length]!;
  return `${first} ${last}`;
}

function numbered(prefix: string, domain: string, count: number, offset: number, roles: SeedPerson['roles']): SeedPerson[] {
  return Array.from({ length: count }, (_, index) => ({
    email: `${prefix}${String(index + 1).padStart(2, '0')}@${domain}`,
    name: personName(index, offset),
    roles,
  }));
}

export const PLATFORM_OWNER = { email: 'owner@shikkhacore.test', name: 'Platform Owner' } as const;

/** Works at both schools: a teacher at Greenfield, a teacher and a parent at Riverside. */
export const SHARED_TEACHER = { email: 'shared.teacher@shikkhacore.test', name: 'Rashed Chowdhury' } as const;

const greenfieldTeachers = numbered('teacher', 'greenfield.test', 20, 0, ['teacher']);
// One teacher also coordinates exams through a custom role.
greenfieldTeachers[0] = { ...greenfieldTeachers[0]!, roles: ['teacher', 'custom:Exam Controller'] };

export const SCHOOLS: readonly SeedSchool[] = [
  {
    slug: 'greenfield',
    name: 'Greenfield International School',
    status: 'active',
    countryCode: 'BD',
    timezone: 'Asia/Dhaka',
    currencyCode: 'BDT',
    defaultLocale: 'en',
    email: 'office@greenfield.test',
    phone: '+8801700000001',
    address: 'House 12, Road 5, Dhanmondi, Dhaka 1205',
    customDomain: 'portal.greenfield.test',
    customRoles: [
      {
        name: 'Exam Controller',
        description: 'Coordinates exams and publishes results.',
        grants: {
          'school.view': 'all',
          'students.view': 'all',
          'results.view': 'all',
          'results.enter': 'all',
          'results.edit': 'all',
          'results.publish': 'all',
        },
      },
    ],
    people: [
      { email: 'owner@greenfield.test', name: 'Farhana Rahman', roles: ['school_owner'] },
      { email: 'admin@greenfield.test', name: 'Tanvir Hasan', roles: ['school_admin'] },
      { email: 'accounts@greenfield.test', name: 'Nusrat Jahan', roles: ['accountant'] },
      { email: 'librarian@greenfield.test', name: 'Kamal Uddin', roles: ['librarian'] },
      { email: 'hr@greenfield.test', name: 'Sharmin Akter', roles: ['hr_staff'] },
      ...greenfieldTeachers,
      { email: SHARED_TEACHER.email, name: SHARED_TEACHER.name, roles: ['teacher'] },
      ...numbered('guardian', 'greenfield.test', 10, 3, ['guardian']),
      ...numbered('student', 'greenfield.test', 10, 11, ['student']),
    ],
  },
  {
    slug: 'riverside',
    name: 'Riverside Academy',
    status: 'active',
    countryCode: 'BD',
    timezone: 'Asia/Dhaka',
    currencyCode: 'BDT',
    defaultLocale: 'bn',
    email: 'info@riverside.test',
    phone: '+8801800000002',
    address: 'Plot 7, CDA Avenue, Nasirabad, Chattogram 4000',
    customRoles: [
      {
        name: 'Transport Coordinator',
        description: 'Manages school buses and routes.',
        grants: { 'school.view': 'all', 'students.view': 'all' },
      },
    ],
    people: [
      { email: 'owner@riverside.test', name: 'Mahmudul Karim', roles: ['school_owner'] },
      { email: 'admin@riverside.test', name: 'Ayesha Siddiqua', roles: ['school_admin'] },
      { email: 'accounts@riverside.test', name: 'Shafiqul Islam', roles: ['accountant'] },
      { email: 'transport@riverside.test', name: 'Moinul Haque', roles: ['custom:Transport Coordinator'] },
      ...numbered('teacher', 'riverside.test', 8, 17, ['teacher']),
      { email: SHARED_TEACHER.email, name: SHARED_TEACHER.name, roles: ['teacher', 'guardian'] },
      ...numbered('guardian', 'riverside.test', 5, 23, ['guardian']),
      ...numbered('student', 'riverside.test', 5, 29, ['student']),
    ],
  },
  {
    slug: 'oldtown',
    name: 'Old Town High School',
    status: 'suspended',
    countryCode: 'BD',
    timezone: 'Asia/Dhaka',
    currencyCode: 'BDT',
    defaultLocale: 'bn',
    email: 'office@oldtown.test',
    phone: '+8801900000003',
    address: 'Sadar Road, Barishal 8200',
    customRoles: [],
    people: [{ email: 'owner@oldtown.test', name: 'Selina Parvin', roles: ['school_owner'] }],
  },
];
