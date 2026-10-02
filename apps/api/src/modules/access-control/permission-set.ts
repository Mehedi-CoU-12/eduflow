import {
  PERMISSION_SCOPE_RANK,
  type PermissionGrantDto,
  type PermissionKey,
  type PermissionScope,
} from '@shikkhacore/types';

export interface Grant<K extends PermissionKey = PermissionKey> {
  readonly key: K;
  readonly scope: PermissionScope;
}

/**
 * The effective permissions of a member: the union of all their roles' grants, keeping
 * the broadest scope when several roles grant the same permission.
 */
export class PermissionSet<K extends PermissionKey = PermissionKey> {
  private constructor(private readonly grants: ReadonlyMap<K, PermissionScope>) {}

  static empty<K extends PermissionKey>(): PermissionSet<K> {
    return new PermissionSet(new Map());
  }

  static fromGrants<K extends PermissionKey>(grants: Iterable<Grant<K>>): PermissionSet<K> {
    const merged = new Map<K, PermissionScope>();
    for (const { key, scope } of grants) {
      const current = merged.get(key);
      if (!current || PERMISSION_SCOPE_RANK[scope] > PERMISSION_SCOPE_RANK[current]) merged.set(key, scope);
    }
    return new PermissionSet(merged);
  }

  get size(): number {
    return this.grants.size;
  }

  has(key: K): boolean {
    return this.grants.has(key);
  }

  hasAll(keys: readonly K[]): boolean {
    return keys.every((key) => this.grants.has(key));
  }

  /** The effective data scope for `key`, or null when it is not granted. */
  scopeOf(key: K): PermissionScope | null {
    return this.grants.get(key) ?? null;
  }

  /**
   * True when every grant in `other` is held here with at least the same scope.
   * Used to stop members from handing out (or taking away) more access than they have.
   */
  covers(other: PermissionSet<K>): boolean {
    for (const [key, scope] of other.grants) {
      const mine = this.grants.get(key);
      if (!mine || PERMISSION_SCOPE_RANK[mine] < PERMISSION_SCOPE_RANK[scope]) return false;
    }
    return true;
  }

  toArray(): PermissionGrantDto<K>[] {
    return [...this.grants]
      .map(([key, scope]) => ({ key, scope }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }
}
