'use client';

import React from 'react';
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
} from 'lucide-react';

export function StudentDashboard() {
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

  const { student, metrics, subjects, timetable, recentResults, announcements } = dashboard;

  return (
    <div className="space-y-8">
      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-700/80 border border-violet-500/50 text-[11px] font-semibold text-violet-200 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Enrolled Student
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-violet-200 mt-1">
                <span>Class: <strong className="text-white">{student.className}</strong></span>
                <span>&bull;</span>
                <span>Section: <strong className="text-white">{student.sectionName}</strong></span>
                <span>&bull;</span>
                <span>Roll: <strong className="text-white">{student.rollNumber || 'N/A'}</strong></span>
                <span>&bull;</span>
                <span className="font-mono text-violet-300">{student.admissionNumber}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-right">
            <div className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">Attendance</div>
            <div className="text-2xl font-black text-white mt-0.5">{metrics.attendancePercentage}%</div>
            <div className="text-[11px] text-emerald-300 flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Excellent
            </div>
          </div>
        </div>
      </div>

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
          subtitle="Next term assessments"
        />
        <StatCard
          label="Pending Homework"
          value={metrics.pendingHomework}
          iconName="FileText"
          accent="amber"
          subtitle="Due this week"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <TimetableWidget entries={timetable} title="Today's Class Schedule" />

          {/* Recent Examination Results */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-700" />
                Recent Examination Results
              </h3>
              <span className="text-xs text-slate-500 font-medium">{recentResults.length} published records</span>
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
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-700" />
              My Subjects ({subjects.length})
            </h3>
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

          <AttendanceSummary percentage={metrics.attendancePercentage} statusLabel="Student Status" />

          <AnnouncementList announcements={announcements} title="School Announcements" />
        </div>
      </div>
    </div>
  );
}
