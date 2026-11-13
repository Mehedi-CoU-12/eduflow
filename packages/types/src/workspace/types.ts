import { z } from 'zod';
import type { SchoolSummaryDto, AuditLogDto } from '../dto.js';
import type { SchoolPermissionKey, PermissionScope } from '../access-control/permissions.js';

export const WORKSPACE_TYPES = [
  'owner',
  'admin',
  'principal',
  'teacher',
  'student',
  'guardian',
  'accountant',
  'librarian',
  'hr_staff',
] as const;

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export function isWorkspaceType(value: string): value is WorkspaceType {
  return (WORKSPACE_TYPES as readonly string[]).includes(value);
}

export interface WorkspaceNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly requiredPermission?: SchoolPermissionKey;
  readonly requiredScope?: PermissionScope;
  readonly badge?: string;
  readonly isPlanned?: boolean;
}

export interface WorkspaceNavigationSection {
  readonly title?: string;
  readonly items: readonly WorkspaceNavigationItem[];
}

export interface WorkspaceConfig {
  readonly type: WorkspaceType;
  readonly name: string;
  readonly description: string;
  readonly defaultPath: string;
  readonly primaryRoleKey?: string;
  readonly navigation: readonly WorkspaceNavigationSection[];
}

// -----------------------------------------------------------------------------
// Dashboard DTOs
// -----------------------------------------------------------------------------

export interface AdminDashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  totalSections: number;
  studentAttendanceTodayPercentage: number;
  pendingAdmissions: number;
  upcomingExaminations: number;
}

export interface AdminDashboardDto {
  metrics: AdminDashboardMetrics;
  recentActivities: AuditLogDto[];
  school: SchoolSummaryDto;
}

export interface TeacherSectionItem {
  id: string;
  sectionId: string;
  name: string;
  classId: string;
  className: string;
  classCode: string;
  studentCount: number;
  isClassTeacher: boolean;
  subjectId?: string | null;
  subjectName?: string | null;
}

export interface TimetableEntry {
  id: string;
  period: string;
  time: string;
  subject: string;
  className: string;
  sectionName: string;
  room?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority?: 'normal' | 'important' | 'urgent';
}

export interface TeacherDashboardDto {
  assignedSections: TeacherSectionItem[];
  metrics: {
    totalClasses: number;
    totalStudents: number;
    attendancePending: number;
    upcomingExaminations: number;
    activeAssignments: number;
  };
  timetable: TimetableEntry[];
  announcements: AnnouncementItem[];
}

export interface StudentProfileDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  admissionNumber: string;
  rollNumber: string | null;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  status: string;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface StudentGuardianDto {
  id: string;
  guardianUserId: string;
  name: string;
  email: string;
  phone?: string | null;
  relationship: string;
  isPrimary: boolean;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  type: string;
  creditHours?: number | null;
}

export interface StudentDashboardDto {
  student: StudentProfileDto;
  guardians?: StudentGuardianDto[];
  metrics: {
    attendancePercentage: number;
    pendingHomework: number;
    upcomingExaminations: number;
    totalSubjects: number;
  };
  subjects: SubjectItem[];
  timetable: TimetableEntry[];
  recentResults: {
    examName: string;
    subject: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
  }[];
  announcements: AnnouncementItem[];
}

export interface GuardianChildDto {
  id: string;
  studentId: string;
  userId: string;
  name: string;
  admissionNumber: string;
  rollNumber: string | null;
  className: string;
  sectionName: string;
  relationship: string;
  isPrimary: boolean;
}

export interface GuardianDashboardDto {
  children: GuardianChildDto[];
  selectedChildId: string | null;
  childDashboard: StudentDashboardDto | null;
  fees: {
    outstandingAmount: number;
    currency: string;
    pendingInvoices: number;
    lastPaymentDate?: string | null;
  };
  announcements: AnnouncementItem[];
}

export interface AccountantDashboardDto {
  metrics: {
    totalCollected: number;
    outstandingInvoices: number;
    todayCollection: number;
    pendingPayments: number;
    currency: string;
  };
  feeStructuresCount: number;
  moduleStatus: 'active' | 'planned';
  recentTransactions: {
    id: string;
    studentName: string;
    admissionNumber: string;
    amount: number;
    currency: string;
    date: string;
    status: 'completed' | 'pending' | 'refunded';
  }[];
}

export interface PlannedModuleDto {
  module: string;
  title: string;
  description: string;
  status: 'planned';
  metrics: Record<string, number | string>;
  plannedFeatures: string[];
}

export interface UserWorkspacesDto {
  workspaces: {
    type: WorkspaceType;
    name: string;
    description: string;
    isPrimary: boolean;
  }[];
  defaultWorkspace: WorkspaceType;
}

// -----------------------------------------------------------------------------
// Query Schemas
// -----------------------------------------------------------------------------

export const guardianDashboardQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
});

export type GuardianDashboardQuery = z.infer<typeof guardianDashboardQuerySchema>;
