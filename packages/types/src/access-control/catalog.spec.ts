import { describe, expect, it } from '@jest/globals';

import {
  PERMISSIONS,
  PERMISSION_KEYS,
  PLATFORM_PERMISSION_KEYS,
  SCHOOL_PERMISSION_KEYS,
  maxScopeOf,
  type PermissionKey,
  type PermissionScope,
} from './permissions.js';
import { PLATFORM_SYSTEM_ROLES, SCHOOL_SYSTEM_ROLES, SYSTEM_ROLES } from './system-roles.js';

describe('permission catalog', () => {
  it('uses <module>.<action> keys whose prefix matches the module', () => {
    for (const key of PERMISSION_KEYS) {
      expect(key).toMatch(/^[a-z]+(\.[a-z_]+)+$/);
      const definition = PERMISSIONS[key];
      if (definition.realm === 'platform') expect(key.startsWith('platform.')).toBe(true);
      else expect(key.startsWith(`${definition.module}.`) || definition.module === 'school').toBe(true);
    }
  });

  it('partitions keys into school and platform realms', () => {
    expect(SCHOOL_PERMISSION_KEYS.length + PLATFORM_PERMISSION_KEYS.length).toBe(PERMISSION_KEYS.length);
    expect(SCHOOL_PERMISSION_KEYS).toContain('results.publish');
    expect(PLATFORM_PERMISSION_KEYS).toContain('platform.schools.view');
  });

  it('reports the broadest grantable scope', () => {
    expect(maxScopeOf('students.view')).toBe('all');
    expect(maxScopeOf('fees.view')).toBe('all');
  });
});

describe('system roles', () => {
  it('only grant permissions of their own realm with an allowed scope', () => {
    for (const [roleKey, role] of Object.entries(SYSTEM_ROLES)) {
      const grants = Object.entries(role.grants) as [PermissionKey, PermissionScope][];
      expect(grants.length).toBeGreaterThan(0);
      for (const [permission, scope] of grants) {
        const definition = PERMISSIONS[permission];
        expect({ roleKey, permission, realm: definition.realm }).toEqual({
          roleKey,
          permission,
          realm: role.realm,
        });
        expect(definition.scopes).toContain(scope);
      }
    }
  });

  it('gives the school owner every school permission and the admin all but billing', () => {
    expect(Object.keys(SCHOOL_SYSTEM_ROLES.school_owner.grants).sort()).toEqual([...SCHOOL_PERMISSION_KEYS].sort());
    expect(SCHOOL_SYSTEM_ROLES.school_admin.grants).not.toHaveProperty('subscription.manage');
    expect(Object.keys(PLATFORM_SYSTEM_ROLES.platform_owner.grants).sort()).toEqual(
      [...PLATFORM_PERMISSION_KEYS].sort(),
    );
  });

  it('never lets teachers, students or guardians see every student', () => {
    expect(SCHOOL_SYSTEM_ROLES.teacher.grants['students.view']).toBe('assigned');
    expect(SCHOOL_SYSTEM_ROLES.student.grants['students.view']).toBe('own');
    expect(SCHOOL_SYSTEM_ROLES.guardian.grants['students.view']).toBe('own');
  });
});
