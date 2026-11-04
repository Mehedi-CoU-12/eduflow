import type { SchoolPermissionKey, WorkspaceType } from '@eduflow/types';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  requiredPermission?: SchoolPermissionKey;
  badge?: string;
  isPlanned?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const WORKSPACE_NAVIGATION: Record<WorkspaceType, NavSection[]> = {
  owner: [
    {
      title: 'School Management',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=owner', icon: 'LayoutDashboard' },
        { id: 'academics', label: 'Academic Management', href: '/academics', icon: 'BookOpen', requiredPermission: 'academics.view' },
        { id: 'members', label: 'Members & Staff', href: '/members', icon: 'Users', requiredPermission: 'users.view' },
        { id: 'roles', label: 'Users and Roles', href: '/roles', icon: 'Shield', requiredPermission: 'roles.view' },
        { id: 'admissions', label: 'Admissions', href: '/?workspace=owner&tab=admissions', icon: 'UserPlus', requiredPermission: 'students.create', isPlanned: true, badge: 'Planned' },
        { id: 'attendance', label: 'Attendance', href: '/?workspace=owner&tab=attendance', icon: 'CalendarCheck', requiredPermission: 'attendance.view', isPlanned: true, badge: 'Planned' },
        { id: 'examinations', label: 'Examinations', href: '/?workspace=owner&tab=examinations', icon: 'FileSpreadsheet', requiredPermission: 'results.view', isPlanned: true, badge: 'Planned' },
        { id: 'results', label: 'Results', href: '/?workspace=owner&tab=results', icon: 'Award', requiredPermission: 'results.publish', isPlanned: true, badge: 'Planned' },
        { id: 'fees', label: 'Fees & Finance', href: '/?workspace=accountant', icon: 'DollarSign', requiredPermission: 'fees.view' },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        { id: 'audit', label: 'Audit Logs', href: '/audit', icon: 'Clock', requiredPermission: 'audit.view' },
        { id: 'settings', label: 'School Settings', href: '/settings', icon: 'Settings', requiredPermission: 'school.update' },
      ],
    },
  ],

  admin: [
    {
      title: 'School Administration',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=admin', icon: 'LayoutDashboard' },
        { id: 'academics', label: 'Academic Structure', href: '/academics', icon: 'BookOpen', requiredPermission: 'academics.view' },
        { id: 'members', label: 'Members Directory', href: '/members', icon: 'Users', requiredPermission: 'users.view' },
        { id: 'roles', label: 'Roles & Scopes', href: '/roles', icon: 'Shield', requiredPermission: 'roles.view' },
        { id: 'admissions', label: 'Admissions', href: '/?workspace=admin&tab=admissions', icon: 'UserPlus', requiredPermission: 'students.create', isPlanned: true, badge: 'Planned' },
        { id: 'attendance', label: 'Attendance', href: '/?workspace=admin&tab=attendance', icon: 'CalendarCheck', requiredPermission: 'attendance.view', isPlanned: true, badge: 'Planned' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'audit', label: 'Audit Trail', href: '/audit', icon: 'Clock', requiredPermission: 'audit.view' },
        { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings', requiredPermission: 'school.view' },
      ],
    },
  ],

  principal: [
    {
      title: 'Academic Leadership',
      items: [
        { id: 'overview', label: 'Academic Overview', href: '/?workspace=principal', icon: 'LayoutDashboard' },
        { id: 'classes', label: 'Classes & Sections', href: '/academics', icon: 'BookOpen', requiredPermission: 'academics.view' },
        { id: 'teachers', label: 'Teachers', href: '/members', icon: 'Users', requiredPermission: 'users.view' },
        { id: 'attendance', label: 'Attendance Overview', href: '/?workspace=principal&tab=attendance', icon: 'CalendarCheck', isPlanned: true, badge: 'Planned' },
        { id: 'examinations', label: 'Examinations', href: '/?workspace=principal&tab=examinations', icon: 'FileSpreadsheet', isPlanned: true, badge: 'Planned' },
        { id: 'results', label: 'Result Approvals', href: '/?workspace=principal&tab=results', icon: 'Award', requiredPermission: 'results.publish', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],

  teacher: [
    {
      title: 'Teaching Workspace',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=teacher', icon: 'LayoutDashboard' },
        { id: 'my-classes', label: 'My Classes', href: '/?workspace=teacher&tab=classes', icon: 'GraduationCap' },
        { id: 'my-students', label: 'My Students', href: '/?workspace=teacher&tab=students', icon: 'Users', requiredPermission: 'students.view' },
        { id: 'timetable', label: 'Timetable', href: '/?workspace=teacher&tab=timetable', icon: 'Clock' },
        { id: 'attendance', label: 'Attendance', href: '/?workspace=teacher&tab=attendance', icon: 'CalendarCheck', requiredPermission: 'attendance.mark', isPlanned: true, badge: 'Planned' },
        { id: 'assignments', label: 'Assignments', href: '/?workspace=teacher&tab=assignments', icon: 'FileText', isPlanned: true, badge: 'Planned' },
        { id: 'examinations', label: 'Examinations', href: '/?workspace=teacher&tab=examinations', icon: 'FileSpreadsheet', isPlanned: true, badge: 'Planned' },
        { id: 'enter-marks', label: 'Enter Marks', href: '/?workspace=teacher&tab=marks', icon: 'Award', requiredPermission: 'results.enter', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],

  student: [
    {
      title: 'Learning Portal',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/?workspace=student', icon: 'LayoutDashboard' },
        { id: 'profile', label: 'My Profile', href: '/?workspace=student&tab=profile', icon: 'User' },
        { id: 'timetable', label: 'My Timetable', href: '/?workspace=student&tab=timetable', icon: 'Clock' },
        { id: 'subjects', label: 'My Subjects', href: '/?workspace=student&tab=subjects', icon: 'BookOpen' },
        { id: 'attendance', label: 'My Attendance', href: '/?workspace=student&tab=attendance', icon: 'CalendarCheck', isPlanned: true, badge: 'Planned' },
        { id: 'homework', label: 'Homework & Tasks', href: '/?workspace=student&tab=homework', icon: 'FileText', isPlanned: true, badge: 'Planned' },
        { id: 'examinations', label: 'Examinations', href: '/?workspace=student&tab=examinations', icon: 'FileSpreadsheet', isPlanned: true, badge: 'Planned' },
        { id: 'results', label: 'My Results', href: '/?workspace=student&tab=results', icon: 'Award', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],

  guardian: [
    {
      title: 'Parent Portal',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=guardian', icon: 'LayoutDashboard' },
        { id: 'my-children', label: 'My Children', href: '/?workspace=guardian&tab=children', icon: 'Users' },
        { id: 'attendance', label: 'Attendance', href: '/?workspace=guardian&tab=attendance', icon: 'CalendarCheck', isPlanned: true, badge: 'Planned' },
        { id: 'results', label: 'Academic Results', href: '/?workspace=guardian&tab=results', icon: 'Award', isPlanned: true, badge: 'Planned' },
        { id: 'timetable', label: 'Class Timetable', href: '/?workspace=guardian&tab=timetable', icon: 'Clock' },
        { id: 'fees', label: 'Fee Statements', href: '/?workspace=guardian&tab=fees', icon: 'DollarSign' },
      ],
    },
  ],

  accountant: [
    {
      title: 'Finance & Accounts',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=accountant', icon: 'LayoutDashboard' },
        { id: 'structures', label: 'Fee Structures', href: '/?workspace=accountant&tab=structures', icon: 'Layers', requiredPermission: 'fees.create', isPlanned: true, badge: 'Planned' },
        { id: 'invoices', label: 'Invoices', href: '/?workspace=accountant&tab=invoices', icon: 'FileText', requiredPermission: 'fees.view', isPlanned: true, badge: 'Planned' },
        { id: 'payments', label: 'Payments & Receipts', href: '/?workspace=accountant&tab=payments', icon: 'DollarSign', requiredPermission: 'fees.collect', isPlanned: true, badge: 'Planned' },
        { id: 'reports', label: 'Financial Reports', href: '/?workspace=accountant&tab=reports', icon: 'BarChart2', requiredPermission: 'fees.view', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],

  librarian: [
    {
      title: 'Library System',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=librarian', icon: 'LayoutDashboard' },
        { id: 'books', label: 'Book Catalog', href: '/?workspace=librarian&tab=books', icon: 'BookOpen', isPlanned: true, badge: 'Planned' },
        { id: 'borrowing', label: 'Borrowing & Returns', href: '/?workspace=librarian&tab=circulation', icon: 'Repeat', isPlanned: true, badge: 'Planned' },
        { id: 'overdue', label: 'Overdue Books', href: '/?workspace=librarian&tab=overdue', icon: 'AlertTriangle', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],

  hr_staff: [
    {
      title: 'HR & Personnel',
      items: [
        { id: 'overview', label: 'Overview', href: '/?workspace=hr_staff', icon: 'LayoutDashboard' },
        { id: 'staff', label: 'Staff Directory', href: '/members', icon: 'Users', requiredPermission: 'users.view' },
        { id: 'attendance', label: 'Staff Attendance', href: '/?workspace=hr_staff&tab=attendance', icon: 'CalendarCheck', isPlanned: true, badge: 'Planned' },
        { id: 'leave', label: 'Leave Requests', href: '/?workspace=hr_staff&tab=leave', icon: 'Clock', isPlanned: true, badge: 'Planned' },
        { id: 'payroll', label: 'Payroll Overview', href: '/?workspace=hr_staff&tab=payroll', icon: 'DollarSign', isPlanned: true, badge: 'Planned' },
      ],
    },
  ],
};

/**
 * Filters navigation items against the user's granted permissions.
 */
export function getFilteredNavigation(
  workspaceType: WorkspaceType,
  userPermissions: { key: string; scope: string }[] = [],
): NavSection[] {
  const sections = WORKSPACE_NAVIGATION[workspaceType] ?? [];
  const permissionKeys = new Set(userPermissions.map((p) => p.key));

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.requiredPermission) return true;
        return permissionKeys.has(item.requiredPermission);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
