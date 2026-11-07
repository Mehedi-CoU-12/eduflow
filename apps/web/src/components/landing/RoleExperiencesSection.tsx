'use client';

import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  Briefcase,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface RoleExperience {
  id: string;
  role: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderHover: string;
  bgLight: string;
  summary: string;
  keyActions: string[];
  previewSnippet: {
    title: string;
    items: { label: string; value: string; badge?: string }[];
  };
}

export function RoleExperiencesSection() {
  const [selectedRole, setSelectedRole] = useState<string>('admin');

  const roles: RoleExperience[] = [
    {
      id: 'admin',
      role: 'Administrators & Principals',
      title: 'Institutional Governance & Leadership',
      badge: 'Full Operational Control',
      icon: Shield,
      accentColor: 'text-teal-700 bg-teal-50',
      borderHover: 'hover:border-teal-600/60',
      bgLight: 'from-teal-900 to-teal-800',
      summary:
        'Manage school operations, academic years, faculty assignments, student enrollments, role-based access, and institutional compliance.',
      keyActions: [
        'Academic calendar, classes, sections & subjects',
        'Staff invitations and granular role permissions',
        'Institutional attendance & examination oversight',
        'Append-only immutable audit trail inspection',
      ],
      previewSnippet: {
        title: 'Institutional Overview',
        items: [
          { label: 'Enrolled Students', value: '1,248' },
          { label: 'Active Faculty', value: '68' },
          { label: 'Attendance Rate', value: '96.2%', badge: 'High' },
          { label: 'Active Subdomain', value: 'greenwood.eduflow.app' },
        ],
      },
    },
    {
      id: 'teacher',
      role: 'Teachers & Faculty',
      title: 'Classroom & Academic Management',
      badge: 'Assigned Classes Only',
      icon: BookOpen,
      accentColor: 'text-blue-700 bg-blue-50',
      borderHover: 'hover:border-blue-600/60',
      bgLight: 'from-blue-900 to-indigo-900',
      summary:
        'Focused workspace strictly scoped to assigned classes, sections, daily attendance recording, timetable periods, and marks entry.',
      keyActions: [
        'Quick attendance recording for assigned sections',
        'Weekly teaching timetable & subject curriculum',
        'Term marks entry with grade point calculations',
        'Direct class announcements & circulars',
      ],
      previewSnippet: {
        title: 'Faculty Teaching Roster',
        items: [
          { label: 'Assigned Sections', value: 'Class 9-A, 10-A, 10-B' },
          { label: 'Teaching Subject', value: 'Higher Mathematics' },
          { label: 'Next Lecture', value: 'Period 3 (11:00 AM)', badge: 'Today' },
          { label: 'Pending Marks', value: 'Mid-Term Exam (24/40)' },
        ],
      },
    },
    {
      id: 'student',
      role: 'Students',
      title: 'Personal Learning & Results Portal',
      badge: 'Individual Student Scope',
      icon: GraduationCap,
      accentColor: 'text-violet-700 bg-violet-50',
      borderHover: 'hover:border-violet-600/60',
      bgLight: 'from-violet-900 to-purple-900',
      summary:
        'Personal academic hub to review daily class timetables, attendance history, term exam results, and official school announcements.',
      keyActions: [
        'Daily & weekly schedule with period times and rooms',
        'Personal attendance rate tracking & absence logs',
        'Published examination marks and subject GPA',
        'School notices and academic circulars',
      ],
      previewSnippet: {
        title: 'Student Academic Record',
        items: [
          { label: 'Student ID', value: '2026-0941' },
          { label: 'Enrolled Class', value: 'Class 10 - Section A' },
          { label: 'Term Attendance', value: '98.5%' },
          { label: 'Latest GPA', value: '4.95 / 5.00', badge: 'Verified' },
        ],
      },
    },
    {
      id: 'guardian',
      role: 'Parents & Guardians',
      title: 'Family Oversight & Child Progress',
      badge: 'Family Portal Scope',
      icon: Users,
      accentColor: 'text-amber-700 bg-amber-50',
      borderHover: 'hover:border-amber-600/60',
      bgLight: 'from-amber-900 to-orange-900',
      summary:
        'Monitor each child’s attendance, verified examination results, upcoming schedules, and school updates from one unified parent account.',
      keyActions: [
        'Multi-child switcher for families with several enrolled children',
        'Instant visibility into daily presence and missed classes',
        'Verified terminal examination results and report card reviews',
        'School notices and parent-teacher meeting notifications',
      ],
      previewSnippet: {
        title: 'Linked Child Profile',
        items: [
          { label: 'Active Child', value: 'Sarah Rahman (Class 10-A)' },
          { label: 'Today’s Status', value: 'Present in Class', badge: 'Present' },
          { label: 'Term Results', value: 'Grade A+ (Math & Science)' },
          { label: 'Next Exam', value: 'Physics Mid-Term (Monday)' },
        ],
      },
    },
    {
      id: 'accountant',
      role: 'Accountants & Bursars',
      title: 'School Accounts & Billing Operations',
      badge: 'Financial Desk Scope',
      icon: CreditCard,
      accentColor: 'text-emerald-700 bg-emerald-50',
      borderHover: 'hover:border-emerald-600/60',
      bgLight: 'from-emerald-900 to-teal-900',
      summary:
        'Dedicated workspace to manage tuition fees, generate student invoices, record offline and online receipts, and audit collections.',
      keyActions: [
        'Grade-specific fee structures and tuition scheduling',
        'Student invoice generation and balance calculations',
        'Payment reconciliation and receipt issuance',
        'Term collection summaries for school leadership',
      ],
      previewSnippet: {
        title: 'Accounts Desk Summary',
        items: [
          { label: 'Billing Term', value: 'Term 1 Tuition Fees' },
          { label: 'Collection Rate', value: '88.4%', badge: 'On Track' },
          { label: 'Pending Dues', value: '142 Invoices' },
          { label: 'Last Batch', value: '48 Receipts Reconciled' },
        ],
      },
    },
    {
      id: 'staff',
      role: 'School Staff & Officers',
      title: 'Operational Support & Admissions',
      badge: 'Departmental Scope',
      icon: Briefcase,
      accentColor: 'text-slate-700 bg-slate-100',
      borderHover: 'hover:border-slate-500/60',
      bgLight: 'from-slate-900 to-slate-800',
      summary:
        'Admissions officers, librarians, and administrative staff access specialized tools according to their designated school roles.',
      keyActions: [
        'Student admission processing and verification',
        'Guardian contact linking and address validation',
        'Institutional document and roster printing',
        'Operational task queues and support workflows',
      ],
      previewSnippet: {
        title: 'Operational Desk',
        items: [
          { label: 'Pending Admissions', value: '18 Applications', badge: 'Active' },
          { label: 'Roster Exports', value: 'Class 6 - 10 Generated' },
          { label: 'Records Updated', value: '34 Profiles Verified' },
          { label: 'Audit Scopes', value: 'Compliance Enforced' },
        ],
      },
    },
  ];

  const activeRoleData: RoleExperience = roles.find((r) => r.id === selectedRole) ?? roles[0]!;
  const ActiveIcon = activeRoleData.icon;

  return (
    <section id="solutions" className="py-20 sm:py-28 bg-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Role-Based Experiences
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tailored for Everyone in Your School Community
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            A school ERP should never be a one-size-fits-all clutter. EduFlow automatically delivers a dedicated,
            focused experience tailored to each person’s exact responsibilities.
          </p>
        </div>

        {/* Interactive Persona Tabs for Desktop */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {roles.map((item) => {
            const Icon = item.icon;
            const isSelected = item.id === selectedRole;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedRole(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.role.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Spotlight Showcase */}
        <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Role Details */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
                <ActiveIcon className="w-4 h-4" />
                <span>{activeRoleData.badge}</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {activeRoleData.role}
                </h3>
                <p className="text-sm font-semibold text-teal-400 mt-1">{activeRoleData.title}</p>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  {activeRoleData.summary}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Capabilities</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  {activeRoleData.keyActions.map((action) => (
                    <div key={action} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Mini Tailored Dashboard Preview */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-5 sm:p-6 text-slate-900 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <ActiveIcon className="w-4 h-4 text-teal-300" />
                  <span className="text-xs font-bold tracking-tight">{activeRoleData.previewSnippet.title}</span>
                </div>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-900/50 px-2 py-0.5 rounded border border-teal-400/30">
                  Live Preview
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {activeRoleData.previewSnippet.items.map((row) => (
                  <div
                    key={row.label}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-400">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{row.value}</span>
                      {row.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {row.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tenant-isolated scope</span>
                <span className="text-teal-300 font-semibold">EduFlow Secure Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Quick Role Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item) => {
            const Icon = item.icon;
            const isSelected = item.id === selectedRole;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedRole(item.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/50 border-teal-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.accentColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.role}</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.summary}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700">
                  <span>Explore workspace view</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
