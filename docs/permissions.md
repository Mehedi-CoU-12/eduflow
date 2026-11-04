# EduFlow Permissions & Access Control Architecture

EduFlow employs a multi-tenant, permission-based access control (RBAC) model with granular data scoping. Permissions are defined centrally in `@eduflow/types` and evaluated independently on every backend request.

---

## 1. Permission Realms

Permissions are divided into two distinct, non-overlapping realms:
- `school`: Granted via school-level roles and evaluated inside a tenant (school subdomain) context.
- `platform`: Granted exclusively to EduFlow platform operators (`platform_owner`) and evaluated on the platform admin host (`admin.localhost`).

School permissions cannot be granted to platform users, and platform permissions cannot leak into school contexts.

---

## 2. Granular Data Scopes

Every school permission grant is paired with a data scope that restricts the breadth of records accessible to the authenticated member:

| Scope | Numerical Rank | Semantic Meaning | Typical Usage |
| :--- | :---: | :--- | :--- |
| `own` | 1 | Records explicitly about the user themself or their linked children | Students (own grades/attendance), Guardians (linked children) |
| `assigned` | 2 | Records linked to the user's specific classroom or section assignments | Teachers (assigned classes, sections, students) |
| `all` | 3 | All records within the resolved school tenant | School Owner, School Admin, Academic Coordinator |

### Scope Merging Semantics
When a member holds multiple roles (e.g., **Teacher** + **Exam Coordinator**), permissions are computed as the union of all granted permissions. If a permission is granted across multiple roles with different scopes, **the broadest scope (highest rank) wins**.

Example:
- Role A grants `results.view` with scope `assigned` (Rank 2).
- Role B grants `results.view` with scope `all` (Rank 3).
- **Effective Permission**: `results.view` with scope `all`.

---

## 3. System Roles & Default Grants

| Role Key | Name | Primary Scope | Granted Capabilities |
| :--- | :--- | :---: | :--- |
| `school_owner` | School Owner | `all` | Unrestricted school administration, membership management, roles, academics, audit logs, and subscription billing (`subscription.manage`). |
| `school_admin` | School Admin | `all` | Full operational school management, admissions, staff assignments, and academic structure. Excludes `subscription.manage`. |
| `principal` | Principal / Academic Head | `all` | Academic performance oversight, syllabus, exam creation, and result publication (`results.publish`). |
| `teacher` | Teacher | `assigned` | Strictly restricted to assigned classes and sections (`academics.view: assigned`, `students.view: assigned`, `attendance.mark: assigned`, `results.enter: assigned`). |
| `student` | Student | `own` | Learning portal access strictly restricted to own enrolled profile (`academics.view: own`, `students.view: own`, `attendance.view: own`, `results.view: own`). |
| `guardian` | Parent / Guardian | `own` | Family portal access strictly restricted to explicitly linked children (`academics.view: own`, `students.view: own`, `attendance.view: own`, `results.view: own`, `fees.view: own`). |
| `accountant` | Accountant | `all` | Fee structures, invoicing, payment counter collection, refunds, and financial reporting (`fees.view: all`, `fees.create: all`, `fees.collect: all`, `fees.refund: all`). |
| `librarian` | Librarian | `all` | Book cataloging, circulation, borrowing tracking, and student lookup (`school.view: all`, `academics.view: all`, `students.view: all`). |
| `hr_staff` | HR Staff | `all` | Staff directory, employee records, and workforce attendance (`school.view: all`, `users.view: all`). |
| `platform_owner` | Platform Owner | `all` | Platform-wide school suspension, activation, and operator audit trail on `admin.localhost`. |

---

## 4. Backend Enforcement & Data Scoping Rules

1. **Defense-in-Depth**:
   Frontend link hiding or UI disabled states are presentation conveniences only. Every API endpoint enforces authorization via `@RequirePermissions(...)` or `@TenantMember()`.
2. **Fail-Closed Queries**:
   All database queries are executed inside `AppDatabase.withTenant({ schoolId, userId })`. PostgreSQL 18 Row Level Security (RLS) automatically filters rows by `school_id`.
3. **Student Boundary Enforcement**:
   - Students query `/dashboard/student`. The service enforces `userId = tx.userId`.
   - Any attempt by a student to request another student's record is blocked at the SQL query level.
4. **Guardian Child Boundary Enforcement**:
   - Guardians query `/dashboard/guardian?studentId=...`.
   - The backend looks up `GuardianStudent` where `guardianUserId = tx.userId AND studentId = :studentId AND schoolId = tx.schoolId`.
   - If the requested `studentId` is not explicitly linked, the request fails with `403 Forbidden (CHILD_ACCESS_DENIED)`.
5. **Teacher Assignment Boundary Enforcement**:
   - Teachers query `/dashboard/teacher`.
   - Only classes and sections with an active row in `TeacherAssignment` where `teacherUserId = tx.userId` are returned.
6. **Accountant Result Boundary Enforcement**:
   - Accountants hold `fees.*` permissions but lack `results.enter` or `results.publish`.
   - Direct API calls to mark entry endpoints return `403 Forbidden (PERMISSION_DENIED)`.

---

## 5. Non-Escalation & Owner Invariant

- **Non-Escalation**: A member can only create or edit custom roles whose permissions are a subset of the member's own effective permissions (`tenant.permissions.covers(requestedGrants)`).
- **Owner Invariant**: A school must retain at least one active `school_owner`. A role update or member removal that would leave a school with zero owners is rejected with `409 Conflict (LAST_OWNER_REQUIRED)`.
