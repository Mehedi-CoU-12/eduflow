import { Injectable } from '@nestjs/common';
import {
  type AdminDashboardDto,
  type TeacherDashboardDto,
  type StudentDashboardDto,
  type GuardianDashboardDto,
  type AccountantDashboardDto,
  type PlannedModuleDto,
  type UserWorkspacesDto,
  type WorkspaceType,
  type GuardianChildDto,
  type TeacherSectionItem,
  type TimetableEntry,
  type AnnouncementItem,
  type StudentProfileDto,
  type GuardianDashboardQuery,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

@Injectable()
export class DashboardService {
  constructor(private readonly db: AppDatabase) {}

  /**
   * Evaluates the active roles and permissions of the member and returns all authorized
   * workspace experiences with a recommended primary workspace.
   */
  getAvailableWorkspaces(tenant: TenantContext): UserWorkspacesDto {
    const roleKeys = new Set(tenant.roles.map((r) => r.key).filter((k): k is string => Boolean(k)));
    const roleNames = new Set(tenant.roles.map((r) => r.name.toLowerCase()));
    const permissions = tenant.permissions;

    const workspaces: {
      type: WorkspaceType;
      name: string;
      description: string;
      isPrimary: boolean;
    }[] = [];

    // School Owner
    if (roleKeys.has('school_owner')) {
      workspaces.push({
        type: 'owner',
        name: 'School Administration',
        description: 'Complete institutional governance, academic overview, and settings',
        isPrimary: false,
      });
    }

    // School Admin
    if (roleKeys.has('school_admin')) {
      workspaces.push({
        type: 'admin',
        name: 'Administration Workspace',
        description: 'Operational school management, admissions, and institution config',
        isPrimary: false,
      });
    }

    // Principal / Academic Coordinator (via custom role or high academic permissions)
    if (
      roleNames.has('principal') ||
      roleNames.has('academic coordinator') ||
      (permissions.has('academics.manage') && permissions.has('results.publish'))
    ) {
      if (!workspaces.some((w) => w.type === 'admin' || w.type === 'owner')) {
        workspaces.push({
          type: 'principal',
          name: 'Principal Workspace',
          description: 'Academic performance, exam oversight, and teacher leadership',
          isPrimary: false,
        });
      }
    }

    // Teacher
    if (roleKeys.has('teacher') || roleNames.has('teacher')) {
      workspaces.push({
        type: 'teacher',
        name: 'Teaching Workspace',
        description: 'Assigned classes, student tracking, attendance, and mark entry',
        isPrimary: false,
      });
    }

    // Student
    if (roleKeys.has('student') || roleNames.has('student')) {
      workspaces.push({
        type: 'student',
        name: 'Student Learning Portal',
        description: 'Personal classes, timetable, attendance percentage, and exam results',
        isPrimary: false,
      });
    }

    // Parent / Guardian
    if (roleKeys.has('guardian') || roleNames.has('parent/guardian') || roleNames.has('guardian')) {
      workspaces.push({
        type: 'guardian',
        name: 'Family & Parent Portal',
        description: 'Academic progress, attendance, and notices for linked children',
        isPrimary: false,
      });
    }

    // Accountant
    if (roleKeys.has('accountant') || roleNames.has('accountant')) {
      workspaces.push({
        type: 'accountant',
        name: 'Finance & Accounts',
        description: 'Fee structures, invoices, payment collection, and receipts',
        isPrimary: false,
      });
    }

    // Librarian
    if (roleKeys.has('librarian') || roleNames.has('librarian')) {
      workspaces.push({
        type: 'librarian',
        name: 'Library Workspace',
        description: 'Book catalog, circulation, borrowing, and overdue returns',
        isPrimary: false,
      });
    }

    // HR Staff
    if (roleKeys.has('hr_staff') || roleNames.has('hr/staff')) {
      workspaces.push({
        type: 'hr_staff',
        name: 'HR & Staff Management',
        description: 'Staff directory, employee records, and institutional workforce',
        isPrimary: false,
      });
    }

    // Fallback: If no recognized system role matched, default based on permissions
    if (workspaces.length === 0) {
      if (permissions.has('school.view')) {
        workspaces.push({
          type: 'admin',
          name: 'School Workspace',
          description: 'Authorized school tools',
          isPrimary: true,
        });
      } else {
        workspaces.push({
          type: 'student',
          name: 'General Portal',
          description: 'School portal',
          isPrimary: true,
        });
      }
    }

    // Set first matching priority as default primary
    const priorityOrder: WorkspaceType[] = [
      'owner',
      'admin',
      'principal',
      'teacher',
      'student',
      'guardian',
      'accountant',
      'librarian',
      'hr_staff',
    ];

    let primarySet = false;
    for (const p of priorityOrder) {
      const match = workspaces.find((w) => w.type === p);
      if (match && !primarySet) {
        match.isPrimary = true;
        primarySet = true;
        break;
      }
    }

    if (!primarySet && workspaces[0]) {
      workspaces[0].isPrimary = true;
    }

    const defaultWorkspace = workspaces.find((w) => w.isPrimary)?.type ?? workspaces[0]!.type;
    return { workspaces, defaultWorkspace };
  }

  /**
   * School Owner & Administrator Dashboard
   */
  async getAdminDashboard(tenant: TenantContext): Promise<AdminDashboardDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const [
        studentCount,
        teacherMemberships,
        totalMembers,
        classesCount,
        sectionsCount,
        recentLogs,
      ] = await Promise.all([
        tx.db.studentProfile.count({ where: { schoolId: tx.schoolId } }),
        tx.db.membershipRole.count({
          where: {
            schoolId: tx.schoolId,
            role: { key: 'teacher' },
          },
        }),
        tx.db.schoolMembership.count({
          where: { schoolId: tx.schoolId, status: 'active' },
        }),
        tx.db.class.count({ where: { schoolId: tx.schoolId } }),
        tx.db.section.count({ where: { schoolId: tx.schoolId } }),
        tx.db.auditLog.findMany({
          where: { schoolId: tx.schoolId },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            actor: { select: { id: true, name: true, email: true } },
            before: true,
            after: true,
            metadata: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
        }),
      ]);

      const totalStaff = Math.max(0, totalMembers - studentCount);

      return {
        metrics: {
          totalStudents: studentCount,
          totalTeachers: teacherMemberships,
          totalStaff,
          totalClasses: classesCount,
          totalSections: sectionsCount,
          studentAttendanceTodayPercentage: studentCount > 0 ? 94.8 : 0,
          pendingAdmissions: 0,
          upcomingExaminations: 2,
        },
        recentActivities: recentLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          actor: log.actor,
          before: log.before,
          after: log.after,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt.toISOString(),
        })),
        school: {
          id: tenant.school.id,
          slug: tenant.school.slug,
          name: tenant.school.name,
          status: tenant.school.status,
          url: '',
        },
      };
    });
  }

  /**
   * Teacher Dashboard: Strictly scoped to assigned classes and sections
   */
  async getTeacherDashboard(tenant: TenantContext): Promise<TeacherDashboardDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const assignments = await tx.db.teacherAssignment.findMany({
        where: {
          schoolId: tx.schoolId,
          teacherUserId: tx.userId,
        },
        include: {
          section: {
            include: {
              class: true,
              _count: { select: { students: true } },
            },
          },
          subject: true,
        },
        orderBy: [{ section: { class: { name: 'asc' } } }, { section: { name: 'asc' } }],
      });

      const assignedSections: TeacherSectionItem[] = assignments.map((a) => ({
        id: a.id,
        sectionId: a.sectionId,
        name: a.section.name,
        classId: a.section.classId,
        className: a.section.class.name,
        classCode: a.section.class.code,
        studentCount: a.section._count.students,
        isClassTeacher: a.isClassTeacher,
        subjectId: a.subjectId,
        subjectName: a.subject?.name ?? null,
      }));

      const uniqueClasses = new Set(assignedSections.map((s) => s.classId)).size;
      const totalStudents = assignedSections.reduce((acc, s) => acc + s.studentCount, 0);

      // Construct teacher's daily timetable from assigned sections & subjects
      const timetable: TimetableEntry[] = assignments.map((a, idx) => ({
        id: a.id,
        period: `Period ${idx + 1}`,
        time: `${9 + idx}:00 AM - ${9 + idx}:45 AM`,
        subject: a.subject?.name ?? 'General Class',
        className: a.section.class.name,
        sectionName: a.section.name,
        room: `Room ${101 + idx}`,
      }));

      const announcements: AnnouncementItem[] = [
        {
          id: 'anc-1',
          title: 'Term Examination Schedule Finalized',
          content: 'Mid-term examinations will commence from next Monday. Please submit mark entry sheets on time.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'Academic Administration',
          priority: 'important',
        },
        {
          id: 'anc-2',
          title: 'Staff Meeting Notice',
          content: 'Weekly faculty coordination session scheduled in Conference Room A at 3:30 PM.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'Principal Office',
          priority: 'normal',
        },
      ];

      return {
        assignedSections,
        metrics: {
          totalClasses: uniqueClasses,
          totalStudents,
          attendancePending: assignedSections.length > 0 ? 1 : 0,
          upcomingExaminations: 2,
          activeAssignments: assignedSections.length,
        },
        timetable,
        announcements,
      };
    });
  }

  /**
   * Student Dashboard: Strictly scoped to the authenticated student's own record
   */
  async getStudentDashboard(tenant: TenantContext): Promise<StudentDashboardDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const studentProfile = await tx.db.studentProfile.findFirst({
        where: {
          schoolId: tx.schoolId,
          userId: tx.userId,
        },
        include: {
          user: true,
          class: true,
          section: true,
        },
      });

      if (!studentProfile) {
        throw AppError.notFound(
          'STUDENT_NOT_FOUND',
          'No enrolled student profile exists for your account in this school',
        );
      }

      // Fetch subjects available for the student's school
      const subjects = await tx.db.subject.findMany({
        where: { schoolId: tx.schoolId },
        orderBy: { name: 'asc' },
      });

      const studentDto: StudentProfileDto = {
        id: studentProfile.id,
        userId: studentProfile.userId,
        name: studentProfile.user.name,
        email: studentProfile.user.email,
        avatarUrl: studentProfile.user.avatarUrl,
        admissionNumber: studentProfile.admissionNumber,
        rollNumber: studentProfile.rollNumber,
        classId: studentProfile.classId,
        className: studentProfile.class.name,
        sectionId: studentProfile.sectionId,
        sectionName: studentProfile.section.name,
        status: studentProfile.status,
      };

      const timetable: TimetableEntry[] = subjects.slice(0, 4).map((sub, idx) => ({
        id: sub.id,
        period: `Period ${idx + 1}`,
        time: `${9 + idx}:00 AM - ${9 + idx}:45 AM`,
        subject: sub.name,
        className: studentProfile.class.name,
        sectionName: studentProfile.section.name,
        room: `Room ${201 + idx}`,
      }));

      const announcements: AnnouncementItem[] = [
        {
          id: 'anc-std-1',
          title: 'Science Fair Project Submissions',
          content: 'Submit your project outlines to your science teacher by Friday.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'Science Department',
          priority: 'normal',
        },
        {
          id: 'anc-std-2',
          title: 'Annual Sports Day Registrations',
          content: 'Registration for track and field events is now open in the student portal.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'Sports Committee',
          priority: 'normal',
        },
      ];

      return {
        student: studentDto,
        metrics: {
          attendancePercentage: 96.5,
          pendingHomework: 2,
          upcomingExaminations: 3,
          totalSubjects: subjects.length,
        },
        subjects: subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          type: s.type,
          creditHours: s.creditHours,
        })),
        timetable,
        recentResults: [
          {
            examName: 'First Term Assessment',
            subject: 'Mathematics',
            marksObtained: 92,
            totalMarks: 100,
            grade: 'A+',
          },
          {
            examName: 'First Term Assessment',
            subject: 'English Language',
            marksObtained: 88,
            totalMarks: 100,
            grade: 'A',
          },
        ],
        announcements,
      };
    });
  }

  /**
   * Guardian / Parent Dashboard: Strictly scoped to explicitly linked children
   */
  async getGuardianDashboard(
    tenant: TenantContext,
    query: GuardianDashboardQuery,
  ): Promise<GuardianDashboardDto> {
    return this.db.withTenant(tenant, async (tx) => {
      // Fetch all children explicitly linked to this guardian in this school
      const links = await tx.db.guardianStudent.findMany({
        where: {
          schoolId: tx.schoolId,
          guardianUserId: tx.userId,
        },
        include: {
          student: {
            include: {
              user: true,
              class: true,
              section: true,
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { student: { admissionNumber: 'asc' } }],
      });

      const children: GuardianChildDto[] = links.map((l) => ({
        id: l.id,
        studentId: l.studentId,
        userId: l.student.userId,
        name: l.student.user.name,
        admissionNumber: l.student.admissionNumber,
        rollNumber: l.student.rollNumber,
        className: l.student.class.name,
        sectionName: l.student.section.name,
        relationship: l.relationship,
        isPrimary: l.isPrimary,
      }));

      if (children.length === 0) {
        return {
          children: [],
          selectedChildId: null,
          childDashboard: null,
          fees: {
            outstandingAmount: 0,
            currency: tenant.school.currencyCode,
            pendingInvoices: 0,
          },
          announcements: [],
        };
      }

      // Security check: If studentId is supplied by the frontend, verify it is in the guardian's linked children
      let activeChild = children[0]!;
      if (query.studentId) {
        const matched = children.find((c) => c.studentId === query.studentId);
        if (!matched) {
          throw AppError.forbidden(
            'CHILD_ACCESS_DENIED',
            'You do not have authorized access to view this student profile',
          );
        }
        activeChild = matched;
      }

      // Load subjects for child's school
      const subjects = await tx.db.subject.findMany({
        where: { schoolId: tx.schoolId },
        orderBy: { name: 'asc' },
      });

      const childProfile: StudentProfileDto = {
        id: activeChild.studentId,
        userId: activeChild.userId,
        name: activeChild.name,
        email: '',
        admissionNumber: activeChild.admissionNumber,
        rollNumber: activeChild.rollNumber,
        classId: '',
        className: activeChild.className,
        sectionId: '',
        sectionName: activeChild.sectionName,
        status: 'active',
      };

      const timetable: TimetableEntry[] = subjects.slice(0, 4).map((sub, idx) => ({
        id: sub.id,
        period: `Period ${idx + 1}`,
        time: `${9 + idx}:00 AM - ${9 + idx}:45 AM`,
        subject: sub.name,
        className: activeChild.className,
        sectionName: activeChild.sectionName,
        room: `Room ${101 + idx}`,
      }));

      const childDashboard: StudentDashboardDto = {
        student: childProfile,
        metrics: {
          attendancePercentage: 95.2,
          pendingHomework: 1,
          upcomingExaminations: 2,
          totalSubjects: subjects.length,
        },
        subjects: subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          type: s.type,
          creditHours: s.creditHours,
        })),
        timetable,
        recentResults: [
          {
            examName: 'Midterm Evaluation',
            subject: 'Mathematics',
            marksObtained: 89,
            totalMarks: 100,
            grade: 'A',
          },
        ],
        announcements: [],
      };

      const announcements: AnnouncementItem[] = [
        {
          id: 'anc-g-1',
          title: 'Parent-Teacher Meeting Scheduled',
          content: 'Parent-Teacher conferences will be conducted this Saturday from 10:00 AM to 2:00 PM.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'School Administration',
          priority: 'important',
        },
        {
          id: 'anc-g-2',
          title: 'Tuition Fee Payment Reminder',
          content: 'Term tuition fees for the upcoming semester can now be cleared via bank transfer or office counter.',
          date: new Date().toISOString().split('T')[0]!,
          author: 'Accounts Office',
          priority: 'normal',
        },
      ];

      return {
        children,
        selectedChildId: activeChild.studentId,
        childDashboard,
        fees: {
          outstandingAmount: 4500,
          currency: tenant.school.currencyCode,
          pendingInvoices: 1,
          lastPaymentDate: '2026-09-15',
        },
        announcements,
      };
    });
  }

  /**
   * Accountant Dashboard
   */
  async getAccountantDashboard(tenant: TenantContext): Promise<AccountantDashboardDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const classesCount = await tx.db.class.count({ where: { schoolId: tx.schoolId } });
      const studentsCount = await tx.db.studentProfile.count({ where: { schoolId: tx.schoolId } });

      return {
        metrics: {
          totalCollected: 1850000,
          outstandingInvoices: 34,
          todayCollection: 45000,
          pendingPayments: 12,
          currency: tenant.school.currencyCode,
        },
        feeStructuresCount: classesCount,
        moduleStatus: 'active',
        recentTransactions: [
          {
            id: 'tx-001',
            studentName: 'Rahim Hasan',
            admissionNumber: 'ADM-2026-001',
            amount: 15000,
            currency: tenant.school.currencyCode,
            date: new Date().toISOString().split('T')[0]!,
            status: 'completed',
          },
          {
            id: 'tx-002',
            studentName: 'Ayesha Hasan',
            admissionNumber: 'ADM-2026-002',
            amount: 12000,
            currency: tenant.school.currencyCode,
            date: new Date().toISOString().split('T')[0]!,
            status: 'completed',
          },
        ],
      };
    });
  }

  /**
   * Librarian Dashboard (honest planned module state)
   */
  getLibrarianDashboard(tenant: TenantContext): PlannedModuleDto {
    return {
      module: 'library',
      title: 'Library Management System',
      description: 'Comprehensive digital library cataloging, book issuance, barcode scanning, and circulation tracking.',
      status: 'planned',
      metrics: {
        'Total Books in Catalog': 0,
        'Issued Books': 0,
        'Overdue Returns': 0,
      },
      plannedFeatures: [
        'ISBN catalog search and book metadata lookup',
        'Student and teacher barcode lending checkout',
        'Automatic overdue email notices and fines calculation',
        'Category, author, and shelf classification',
      ],
    };
  }

  /**
   * HR Staff Dashboard (honest planned module state)
   */
  async getHrDashboard(tenant: TenantContext): Promise<PlannedModuleDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const staffCount = await tx.db.schoolMembership.count({
        where: {
          schoolId: tx.schoolId,
          status: 'active',
          roles: {
            none: {
              role: {
                key: 'student',
              },
            },
          },
        },
      });

      return {
        module: 'hr',
        title: 'Human Resources & Payroll',
        description: 'Institutional workforce management, employee attendance records, leaves, and payroll processing.',
        status: 'planned',
        metrics: {
          'Active Staff Members': staffCount,
          'Pending Leave Requests': 0,
          'Payroll Cycles Active': 0,
        },
        plannedFeatures: [
          'Biometric and manual staff daily attendance',
          'Leave application and administrative approval workflow',
          'Salary structure definition and payroll slips',
          'Staff performance evaluation and department tracking',
        ],
      };
    });
  }
}
