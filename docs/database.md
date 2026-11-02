# Database Architecture & Conventions

EduFlow uses PostgreSQL 18 with Prisma ORM as its primary data layer.

## Design Conventions

1. **UUIDv7 Primary Keys**:
   - All primary keys are UUIDv7 (`uuidv7()`), providing natural chronological ordering and high B-tree indexing efficiency without database lock contention.
2. **Naming Conventions**:
   - Tables and columns are named in `snake_case` in the database schema.
   - Prisma models and fields are defined in `PascalCase` and `camelCase` respectively, mapped via `@@map` and `@map`.
3. **Defense-in-Depth Constraints**:
   - Check constraints enforce valid email formats, lowercased domains, valid ISO codes (country `[A-Z]{2}`, currency `[A-Z]{3}`), and session expiry timestamps.
   - Database triggers enforce cross-table integrity (e.g., ensuring roles assigned to school memberships belong to the same school or are global system roles).
4. **Append-Only Audit Trail**:
   - `audit_logs` has triggers preventing `UPDATE`, `DELETE`, and `TRUNCATE`, ensuring non-repudiation.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| UserCredential : "has"
    User ||--o{ Session : "has"
    User ||--o{ AuthToken : "receives"
    User ||--o{ SchoolMembership : "belongs to"
    User ||--o| PlatformMembership : "holds"
    User ||--o{ AuditLog : "acts in"

    School ||--o{ SchoolDomain : "owns"
    School ||--o{ SchoolMembership : "has"
    School ||--o{ Role : "defines custom"
    School ||--o{ Session : "active for"
    School ||--o{ AuditLog : "records"

    SchoolMembership ||--o{ MembershipRole : "assigned"
    Role ||--o{ MembershipRole : "assigned to"
    Role ||--o{ RolePermission : "grants"
    Permission ||--o{ RolePermission : "defined in"
    Role ||--o{ PlatformMembership : "assigned to"

    User {
        uuid id PK
        string email UK
        string name
        string phone
        string avatar_url
        string locale
        UserStatus status
        timestamptz email_verified_at
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    UserCredential {
        uuid user_id PK, FK
        string password_hash
        timestamptz password_changed_at
        timestamptz created_at
        timestamptz updated_at
    }

    Session {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        string host
        uuid active_school_id FK
        inet ip_address
        string user_agent
        timestamptz expires_at
        timestamptz revoked_at
    }

    School {
        uuid id PK
        string slug UK
        string name
        SchoolStatus status
        char country_code
        string timezone
        char currency_code
        string default_locale
        OnboardingStatus onboarding_status
        timestamptz created_at
        timestamptz updated_at
    }

    SchoolMembership {
        uuid id PK
        uuid school_id FK
        uuid user_id FK
        MembershipStatus status
        timestamptz created_at
        timestamptz updated_at
    }

    Role {
        uuid id PK
        uuid school_id FK
        Realm realm
        string key UK
        string name
        string description
    }

    RolePermission {
        uuid role_id PK, FK
        string permission_key PK, FK
        PermissionScope scope
    }

    Permission {
        string key PK
        Realm realm
        string module
        string description
        PermissionScope[] scopes
    }

    AuditLog {
        uuid id PK
        uuid school_id FK
        uuid actor_user_id FK
        string action
        string entity_type
        string entity_id
        jsonb before
        jsonb after
        jsonb metadata
        timestamptz created_at
    }
```

## Security & Isolation Triggers

- `audit_logs_append_only`: Blocks any `UPDATE` or `DELETE` on the `audit_logs` table.
- `audit_logs_no_truncate`: Blocks `TRUNCATE` operations on `audit_logs`.
- `role_permissions_integrity`: Validates that the granted permission exists within the role's realm and uses an allowed scope.
- `membership_roles_integrity`: Ensures assigned roles are either platform-independent system roles or custom roles belonging to the same tenant.
- `platform_memberships_integrity`: Confirms platform members only hold platform-realm roles.
