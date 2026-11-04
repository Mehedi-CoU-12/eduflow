'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { TeacherDashboardDto } from '@eduflow/types';
import { StatCard } from '../widgets/StatCard';
import { TimetableWidget } from '../widgets/TimetableWidget';
import { AnnouncementList } from '../widgets/AnnouncementList';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function TeacherDashboard() {
  const { data: dashboard, isLoading, error } = useQuery<TeacherDashboardDto>({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => apiFetch<TeacherDashboardDto>('/dashboard/teacher'),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Failed to load teacher workspace. Please ensure your teacher assignments are configured.
      </div>
    );
  }

  const { assignedSections, metrics, timetable, announcements } = dashboard;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-600/50 text-xs font-semibold text-blue-200 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Faculty Teaching Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Class & Academic Management</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Restricted to your assigned classes, section rosters, syllabus progress, and grade entries.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 text-xs text-blue-100">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Assigned Scoped Access Only</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Classes"
          value={metrics.totalClasses}
          iconName="BookOpen"
          accent="blue"
          subtitle={`${assignedSections.length} section assignments`}
        />
        <StatCard
          label="My Students"
          value={metrics.totalStudents}
          iconName="Users"
          accent="teal"
          subtitle="Across assigned sections"
        />
        <StatCard
          label="Attendance Pending"
          value={metrics.attendancePending}
          iconName="CalendarCheck"
          accent={metrics.attendancePending > 0 ? 'amber' : 'emerald'}
          subtitle={metrics.attendancePending > 0 ? 'Requires marking today' : 'All sections marked'}
        />
        <StatCard
          label="Upcoming Exams"
          value={metrics.upcomingExaminations}
          iconName="Award"
          accent="purple"
          subtitle="Examinations this term"
        />
      </div>

      {/* Assigned Classes Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            My Assigned Classes & Sections
          </h2>
          <span className="text-xs text-slate-500 font-medium">{assignedSections.length} active assignments</span>
        </div>

        {assignedSections.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No class or section assignments recorded for your teacher profile yet. Contact the school administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {assignedSections.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-sm transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-base font-extrabold text-slate-900">{sec.className}</div>
                  {sec.isClassTeacher && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Class Teacher
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  Section: <span className="font-bold text-slate-800">{sec.name}</span>
                </div>

                {sec.subjectName && (
                  <div className="text-xs text-slate-500">
                    Subject: <span className="font-semibold text-slate-700">{sec.subjectName}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{sec.studentCount} students enrolled</span>
                  <button
                    type="button"
                    onClick={() => alert(`Attendance and mark entry for ${sec.className} - ${sec.name} will open.`)}
                    className="text-blue-700 hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    Manage Section <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule & Notices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimetableWidget entries={timetable} title="Today's Teaching Schedule" />
        <AnnouncementList announcements={announcements} title="Faculty Notices & Updates" />
      </div>
    </div>
  );
}
