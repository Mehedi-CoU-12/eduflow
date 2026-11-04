import type { WorkspaceType } from '@eduflow/types';

export interface WorkspaceMeta {
  type: WorkspaceType;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  accentColor: string;
}

export const WORKSPACE_METADATA: Record<WorkspaceType, WorkspaceMeta> = {
  owner: {
    type: 'owner',
    title: 'School Administration',
    subtitle: 'Full institution governance, statistics, academic operations, and settings.',
    badge: 'School Owner',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentColor: 'emerald',
  },
  admin: {
    type: 'admin',
    title: 'Administrative Center',
    subtitle: 'Institutional records, admissions, staff assignments, and configurations.',
    badge: 'Administrator',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    accentColor: 'teal',
  },
  principal: {
    type: 'principal',
    title: 'Principal Workspace',
    subtitle: 'Academic performance, exam oversight, results approvals, and faculty leadership.',
    badge: 'Principal',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentColor: 'indigo',
  },
  teacher: {
    type: 'teacher',
    title: 'Teaching Workspace',
    subtitle: 'Assigned classes, student rosters, attendance tracking, and marks entry.',
    badge: 'Faculty / Teacher',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    accentColor: 'blue',
  },
  student: {
    type: 'student',
    title: 'Student Learning Portal',
    subtitle: 'Class timetable, attendance percentage, subject syllabus, and exam results.',
    badge: 'Student',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    accentColor: 'violet',
  },
  guardian: {
    type: 'guardian',
    title: 'Parent & Family Portal',
    subtitle: 'Academic results, daily attendance, class schedules, and fee balances for your children.',
    badge: 'Guardian',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    accentColor: 'amber',
  },
  accountant: {
    type: 'accountant',
    title: 'Finance & Accounts',
    subtitle: 'Fee structures, invoices, payment reconciliation, and institutional receipts.',
    badge: 'Accountant',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    accentColor: 'cyan',
  },
  librarian: {
    type: 'librarian',
    title: 'Library System',
    subtitle: 'Book cataloging, lending circulation, return tracking, and overdue notifications.',
    badge: 'Librarian',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    accentColor: 'rose',
  },
  hr_staff: {
    type: 'hr_staff',
    title: 'Human Resources',
    subtitle: 'Institutional personnel directory, staff attendance, leaves, and payroll records.',
    badge: 'HR Staff',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: 'slate',
  },
};
