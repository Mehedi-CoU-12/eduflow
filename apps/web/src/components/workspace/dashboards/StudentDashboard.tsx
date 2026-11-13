'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { StudentDashboardDto } from '@eduflow/types';
import { StatCard } from '../widgets/StatCard';
import { AttendanceSummary } from '../widgets/AttendanceSummary';
import { TimetableWidget } from '../widgets/TimetableWidget';
import { AnnouncementList } from '../widgets/AnnouncementList';
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Layers,
  Heart,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  Download,
  Check,
} from 'lucide-react';

type StudentTabKey =
  | 'overview'
  | 'profile'
  | 'timetable'
  | 'subjects'
  | 'attendance'
  | 'homework'
  | 'examinations'
  | 'results';

export function StudentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTab = (searchParams.get('tab') as StudentTabKey) || 'overview';
  const activeTab: StudentTabKey =
    queryTab === ('dashboard' as StudentTabKey) ? 'overview' : queryTab;

  const handleTabChange = (tab: StudentTabKey) => {
    if (tab === 'overview') {
      router.push('/?workspace=student');
    } else {
      router.push(`/?workspace=student&tab=${tab}`);
    }
  };

  const { data: dashboard, isLoading, error } = useQuery<StudentDashboardDto>({
    queryKey: ['dashboard', 'student'],
    queryFn: () => apiFetch<StudentDashboardDto>('/dashboard/student'),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No student profile could be found for your account. Please confirm your enrollment status with the school.
      </div>
    );
  }

  const { student, metrics, subjects, timetable, recentResults, announcements, guardians = [] } = dashboard;

  return (
    <div className="space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm overflow-hidden">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-700/80 border border-violet-500/50 text-[11px] font-semibold text-violet-200 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Enrolled Student Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-violet-200 mt-1">
                <span>Class: <strong className="text-white">{student.className}</strong></span>
                <span>&bull;</span>
                <span>Section: <strong className="text-white">{student.sectionName}</strong></span>
                <span>&bull;</span>
                <span>Roll: <strong className="text-white">{student.rollNumber || 'N/A'}</strong></span>
                <span>&bull;</span>
                <span className="font-mono text-violet-300 font-semibold">{student.admissionNumber}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-right">
            <div className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">Attendance</div>
            <div className="text-2xl font-black text-white mt-0.5">{metrics.attendancePercentage}%</div>
            <div className="text-[11px] text-emerald-300 flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Excellent Standing
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Views */}
      {activeTab === 'overview' && (
        <OverviewTabContent
          student={student}
          metrics={metrics}
          subjects={subjects}
          timetable={timetable}
          recentResults={recentResults}
          announcements={announcements}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTabContent student={student} guardians={guardians} />
      )}

      {activeTab === 'timetable' && (
        <TimetableTabContent timetable={timetable} student={student} />
      )}

      {activeTab === 'subjects' && (
        <SubjectsTabContent subjects={subjects} student={student} />
      )}

      {activeTab === 'attendance' && (
        <AttendanceTabContent metrics={metrics} />
      )}

      {activeTab === 'homework' && (
        <HomeworkTabContent />
      )}

      {activeTab === 'examinations' && (
        <ExaminationsTabContent />
      )}

      {activeTab === 'results' && (
        <ResultsTabContent results={recentResults} />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 1: OVERVIEW CONTENT
// -----------------------------------------------------------------------------
function OverviewTabContent({
  student,
  metrics,
  subjects,
  timetable,
  recentResults,
  announcements,
  onNavigateTab,
}: {
  student: StudentDashboardDto['student'];
  metrics: StudentDashboardDto['metrics'];
  subjects: StudentDashboardDto['subjects'];
  timetable: StudentDashboardDto['timetable'];
  recentResults: StudentDashboardDto['recentResults'];
  announcements: StudentDashboardDto['announcements'];
  onNavigateTab: (tab: StudentTabKey) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Class & Section"
          value={`${student.className} - ${student.sectionName}`}
          iconName="GraduationCap"
          accent="purple"
          subtitle={`Roll No. ${student.rollNumber || 'Assigned'}`}
        />
        <StatCard
          label="Attendance Rate"
          value={`${metrics.attendancePercentage}%`}
          iconName="CalendarCheck"
          accent="teal"
          subtitle="Overall academic year"
        />
        <StatCard
          label="Upcoming Exams"
          value={metrics.upcomingExaminations}
          iconName="Award"
          accent="blue"
          subtitle="Assessments this term"
        />
        <StatCard
          label="Pending Homework"
          value={metrics.pendingHomework}
          iconName="FileText"
          accent="amber"
          subtitle="Tasks due this week"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-700" />
                Today's Class Schedule
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-violet-700 hover:text-violet-800"
              >
                View Full Timetable &rarr;
              </button>
            </div>
            <TimetableWidget entries={timetable} title="Daily Class Schedule" />
          </div>

          {/* Recent Examination Results */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-700" />
                Recent Examination Results
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                className="text-xs font-semibold text-violet-700 hover:text-violet-800"
              >
                View All Results &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentResults.map((result, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{result.subject}</div>
                    <div className="text-[11px] text-slate-500">{result.examName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">
                      {result.marksObtained} / {result.totalMarks}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
                      Grade {result.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Subjects & Announcements */}
        <div className="space-y-6">
          {/* Enrolled Subjects */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-700" />
                My Subjects ({subjects.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('subjects')}
                className="text-[11px] font-semibold text-violet-700 hover:text-violet-800"
              >
                View Details
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {subjects.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{sub.name}</span>
                    <span className="text-slate-400 font-mono ml-1.5 text-[10px]">{sub.code}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sub.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AttendanceSummary percentage={metrics.attendancePercentage} statusLabel="Student Attendance" />

          <AnnouncementList announcements={announcements} title="School Announcements" />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 2: MY ACCOUNT & PROFILE
// -----------------------------------------------------------------------------
function ProfileTabContent({
  student,
  guardians,
}: {
  student: StudentDashboardDto['student'];
  guardians: NonNullable<StudentDashboardDto['guardians']>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Digital Student ID Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-violet-600/20 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-violet-200">
                    Student ID Card
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student.status.toUpperCase()}
                </span>
              </div>

              {/* Photo & Name */}
              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-16 h-16 rounded-xl bg-white/10 border-2 border-violet-400/40 flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden shadow-inner">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    student.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-lg text-white leading-tight truncate">
                    {student.name}
                  </h3>
                  <div className="text-xs text-violet-300 font-mono mt-0.5">
                    ID: {student.admissionNumber}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Roll: <strong className="text-white font-mono">{student.rollNumber || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Card Fields */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-white/10">
                <div>
                  <span className="text-[10px] uppercase text-violet-300 block font-medium">Class & Section</span>
                  <span className="font-bold text-white text-sm">
                    {student.className} &bull; {student.sectionName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-violet-300 block font-medium">Session</span>
                  <span className="font-bold text-white text-sm">2026 Academic</span>
                </div>
              </div>

              {/* Barcode aesthetic representation */}
              <div className="pt-3 border-t border-white/10 flex flex-col items-center">
                <div className="flex items-center gap-1 h-7 opacity-70">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-white ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono tracking-widest text-violet-300 mt-1">
                  {student.admissionNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Identity Verification
            </h4>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Email Status</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-none">
                    {student.email}
                  </div>
                </div>
              </div>
              {student.emailVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Complete Student Account Record & Linked Guardians */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Profile Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Personal & Academic Details</h3>
                  <p className="text-xs text-slate-500">Official student records registered in the institution</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                Active Student
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Student Full Name</span>
                <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Institutional Email</span>
                <div className="font-semibold text-slate-900 text-sm truncate">{student.email}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Admission / Student ID</span>
                <div className="font-mono font-bold text-violet-900 text-sm">{student.admissionNumber}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Class Roll Number</span>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {student.rollNumber || 'Unassigned'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Academic Placement</span>
                <div className="font-semibold text-slate-900 text-sm">
                  {student.className} &bull; {student.sectionName}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contact Telephone</span>
                <div className="font-semibold text-slate-900 text-sm">
                  {student.phone || 'Not recorded'}
                </div>
              </div>
            </div>
          </div>

          {/* Linked Family & Guardians */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Family & Guardian Contacts</h3>
                  <p className="text-xs text-slate-500">Authorized guardians with parent portal access to your records</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {guardians.length} linked {guardians.length === 1 ? 'guardian' : 'guardians'}
              </span>
            </div>

            {guardians.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                No parents or guardians are currently linked to this student account.
                Please reach out to the school administrative office to link your parent's email.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guardians.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{g.name}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {g.relationship}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{g.email}</span>
                      </div>
                      {g.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{g.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      {g.isPrimary ? (
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Primary Emergency Contact
                        </span>
                      ) : (
                        <span className="text-slate-400">Secondary Contact</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & Access Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Security & Data Isolation
            </h4>
            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-violet-700 mt-0.5 shrink-0" />
              <div className="text-xs text-violet-900 space-y-1">
                <div className="font-bold">Row-Level Security Active</div>
                <p className="text-violet-700/90 leading-relaxed">
                  Your student account is restricted to your own classroom roster, personal examinations, and
                  academic timetable. Data is securely isolated per institutional tenant guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 3: TIMETABLE CONTENT
// -----------------------------------------------------------------------------
function TimetableTabContent({
  timetable,
  student,
}: {
  timetable: StudentDashboardDto['timetable'];
  student: StudentDashboardDto['student'];
}) {
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');

  const days: { key: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'; label: string }[] = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-700" />
              Academic Class Timetable
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly class routine for {student.className} &bull; Section {student.sectionName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100">
            {days.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  selectedDay === d.key
                    ? 'bg-white text-violet-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable List for the Day */}
        <div className="space-y-3">
          {timetable.map((period, index) => (
            <div
              key={period.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-violet-300 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                  P{index + 1}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{period.subject}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{period.period}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-slate-600">{period.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {period.room}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                  {period.className} &bull; {period.sectionName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 4: SUBJECTS CONTENT
// -----------------------------------------------------------------------------
function SubjectsTabContent({
  subjects,
  student,
}: {
  subjects: StudentDashboardDto['subjects'];
  student: StudentDashboardDto['student'];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Enrolled Curriculum & Subjects</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered courses and learning modules for {student.className}
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
          {subjects.length} Total Subjects
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub, index) => (
          <div
            key={sub.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-violet-300 hover:shadow-xs transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 flex items-center justify-center font-black text-sm shrink-0">
                0{index + 1}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {sub.type}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base leading-tight">{sub.name}</h4>
              <div className="text-xs text-slate-500 font-mono mt-1">Code: {sub.code}</div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Credit Hours: <strong>{sub.creditHours || 3}</strong></span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 5: ATTENDANCE CONTENT
// -----------------------------------------------------------------------------
function AttendanceTabContent({ metrics }: { metrics: StudentDashboardDto['metrics'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Overall Rate</span>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.attendancePercentage}%</div>
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Well above 75% institutional requirement
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total School Days</span>
          <div className="text-3xl font-extrabold text-slate-900">82 Days</div>
          <p className="text-xs text-slate-500 font-medium">Academic term to date</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Absences Recorded</span>
          <div className="text-3xl font-extrabold text-slate-900">2 Days</div>
          <p className="text-xs text-slate-500 font-medium">1 Excused medical leave</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-violet-700" />
          Monthly Attendance Compliance
        </h4>
        <div className="space-y-3">
          {[
            { month: 'November 2026', present: 10, total: 10, rate: 100 },
            { month: 'October 2026', present: 21, total: 22, rate: 95.5 },
            { month: 'September 2026', present: 22, total: 22, rate: 100 },
            { month: 'August 2026', present: 21, total: 22, rate: 95.5 },
          ].map((m) => (
            <div key={m.month} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-xs">{m.month}</div>
                <div className="text-[11px] text-slate-500">
                  {m.present} of {m.total} days present
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-900 text-sm">{m.rate}%</span>
                <span className="block text-[10px] text-emerald-700 font-semibold">Compliant</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 6: HOMEWORK & TASKS
// -----------------------------------------------------------------------------
function HomeworkTabContent() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Linear Algebra Problem Set 4', subject: 'Mathematics', due: 'Tomorrow, 5:00 PM', status: 'pending', priority: 'high' },
    { id: 2, title: 'English Essay: Perspectives on Literature', subject: 'English Language', due: 'Friday, 11:59 PM', status: 'pending', priority: 'normal' },
    { id: 3, title: 'Physics Lab Report: Optics and Lenses', subject: 'Physics', due: 'Nov 18, 2026', status: 'completed', priority: 'normal' },
    { id: 4, title: 'History Chapter 6 Summary', subject: 'Social Studies', due: 'Nov 12, 2026', status: 'completed', priority: 'normal' },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-700" />
              Homework Assignments & Tasks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Keep track of due assignments and learning deliverables</p>
          </div>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
            {tasks.filter((t) => t.status === 'pending').length} Pending Tasks
          </span>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                task.status === 'completed'
                  ? 'bg-slate-50/50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-violet-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition ${
                    task.status === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white hover:border-violet-500'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-4 h-4" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{task.subject}</span>
                    <span>&bull;</span>
                    <span>Due: {task.due}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {task.priority === 'high' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    High Priority
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {task.status === 'completed' ? 'Submitted' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 7: EXAMINATIONS
// -----------------------------------------------------------------------------
function ExaminationsTabContent() {
  const exams = [
    { name: 'Mid-Term Examination 2026', subject: 'General Mathematics', date: 'Nov 24, 2026', time: '10:00 AM - 12:00 PM', room: 'Hall A', marks: 100 },
    { name: 'Mid-Term Examination 2026', subject: 'English Language & Lit', date: 'Nov 26, 2026', time: '10:00 AM - 12:00 PM', room: 'Hall A', marks: 100 },
    { name: 'Mid-Term Examination 2026', subject: 'General Science', date: 'Nov 28, 2026', time: '10:00 AM - 12:00 PM', room: 'Hall B', marks: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-violet-700" />
              Upcoming Institutional Examinations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Official examination schedule, admit roll instructions, and hall allocation</p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
            {exams.length} Upcoming
          </span>
        </div>

        <div className="space-y-3">
          {exams.map((exam, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-violet-300 hover:shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{exam.subject}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{exam.name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-violet-700" /> {exam.date}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-mono text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {exam.room}
                </span>
                <span className="px-2.5 py-1 rounded bg-violet-50 text-violet-800 border border-violet-200 font-bold">
                  {exam.marks} Marks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB 8: RESULTS & TRANSCRIPT
// -----------------------------------------------------------------------------
function ResultsTabContent({
  results,
}: {
  results: StudentDashboardDto['recentResults'];
}) {
  return (
    <div className="space-y-6">
      {/* Transcript Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-700" />
              Academic Results & Transcripts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Published examination scores, grade points, and performance evaluations</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Overall Grade: A (90.0%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Examination</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((res, i) => {
                const pct = Math.round((res.marksObtained / res.totalMarks) * 100);
                return (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{res.subject}</td>
                    <td className="px-4 py-3.5 text-slate-500">{res.examName}</td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900">
                      {res.marksObtained} / {res.totalMarks}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{pct}%</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
                        {res.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                      Distinction
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
