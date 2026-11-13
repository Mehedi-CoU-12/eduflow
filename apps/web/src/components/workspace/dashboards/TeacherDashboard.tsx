'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SectionRosterDto, TeacherDashboardDto } from '@eduflow/types';
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
  Clock,
  LayoutDashboard,
} from 'lucide-react';

export function TeacherDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const { data: dashboard, isLoading, error } = useQuery<TeacherDashboardDto>({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => apiFetch<TeacherDashboardDto>('/dashboard/teacher'),
    staleTime: 30 * 1000,
  });

  const assignedSections = dashboard?.assignedSections ?? [];
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Auto-select first assigned section
  React.useEffect(() => {
    if (assignedSections.length > 0 && !selectedSectionId) {
      const firstSection = assignedSections[0];
      if (firstSection) {
        setSelectedSectionId(firstSection.id);
      }
    }
  }, [assignedSections, selectedSectionId]);

  const activeSectionId = selectedSectionId || assignedSections[0]?.id || '';

  const { data: rosterData, isLoading: rosterLoading } = useQuery<SectionRosterDto>({
    queryKey: ['rostering', activeSectionId],
    queryFn: () => apiFetch<SectionRosterDto>(`/rostering/sections/${activeSectionId}/students`),
    enabled: Boolean(activeSectionId) && currentTab === 'students',
  });

  const handleTabChange = (tab: string) => {
    if (tab === 'overview') {
      router.push('/?workspace=teacher');
    } else {
      router.push(`/?workspace=teacher&tab=${tab}`);
    }
  };

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

  const { metrics, timetable, announcements } = dashboard;

  const students = rosterData?.students ?? [];
  const currentSection = assignedSections.find((s) => s.id === activeSectionId);

  return (
    <div className="space-y-6">
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

      {/* VIEW 1: MY STUDENTS TAB */}
      {currentTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                Assigned Students Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students enrolled in your assigned sections
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Section:</span>
              <select
                value={activeSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              >
                {assignedSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.className} - {sec.name} ({sec.studentCount} students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Admission #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll #</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Loading classroom students roster...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No enrolled students found in this section.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {student.admissionNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {student.rollNumber || <span className="text-slate-400 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{student.email}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: OVERVIEW OR CLASSES TAB */}
      {(currentTab === 'overview' || currentTab === 'classes') && (
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
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        handleTabChange('students');
                      }}
                      className="text-blue-700 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      View Students <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule & Notices Grid */}
      {(currentTab === 'overview' || currentTab === 'timetable') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimetableWidget entries={timetable} title="Today's Teaching Schedule" />
          <AnnouncementList announcements={announcements} title="Faculty Notices & Updates" />
        </div>
      )}
    </div>
  );
}
