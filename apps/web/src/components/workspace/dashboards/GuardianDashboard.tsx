'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { GuardianDashboardDto } from '@eduflow/types';
import { ChildSelector } from '../widgets/ChildSelector';
import { StatCard } from '../widgets/StatCard';
import { AttendanceSummary } from '../widgets/AttendanceSummary';
import { TimetableWidget } from '../widgets/TimetableWidget';
import { AnnouncementList } from '../widgets/AnnouncementList';
import {
  Users,
  Award,
  DollarSign,
  CalendarCheck,
  AlertCircle,
  FileText,
  CreditCard,
} from 'lucide-react';

export function GuardianDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const queryUrl = selectedChildId
    ? `/dashboard/guardian?studentId=${encodeURIComponent(selectedChildId)}`
    : '/dashboard/guardian';

  const { data: dashboard, isLoading, error } = useQuery<GuardianDashboardDto>({
    queryKey: ['dashboard', 'guardian', selectedChildId],
    queryFn: () => apiFetch<GuardianDashboardDto>(queryUrl),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No linked student profiles found for your parent portal account. Contact school administration to link your student records.
      </div>
    );
  }

  const { children, selectedChildId: activeChildId, childDashboard, fees, announcements } = dashboard;

  const currentSelectedId = selectedChildId || activeChildId;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-800/80 border border-amber-600/50 text-xs font-semibold text-amber-200 mb-2">
              <Users className="w-3.5 h-3.5" />
              Parent & Family Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Family Academic Overview</h1>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
              Track attendance, review examination marks, and manage fee dues for your enrolled children.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-right">
            <div className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider">Linked Children</div>
            <div className="text-2xl font-black text-white">{children.length}</div>
          </div>
        </div>
      </div>

      {/* Child Selector */}
      <ChildSelector
        childrenList={children}
        selectedChildId={currentSelectedId}
        onSelectChild={(id) => setSelectedChildId(id)}
      />

      {/* Selected Child Academic View */}
      {childDashboard ? (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Selected Child"
              value={childDashboard.student.name}
              iconName="Users"
              accent="amber"
              subtitle={`${childDashboard.student.className} • ${childDashboard.student.sectionName}`}
            />
            <StatCard
              label="Attendance Rate"
              value={`${childDashboard.metrics.attendancePercentage}%`}
              iconName="CalendarCheck"
              accent="teal"
              subtitle="Present academic session"
            />
            <StatCard
              label="Upcoming Exams"
              value={childDashboard.metrics.upcomingExaminations}
              iconName="Award"
              accent="blue"
              subtitle="Scheduled assessments"
            />
            <StatCard
              label="Outstanding Dues"
              value={`${fees.outstandingAmount} ${fees.currency}`}
              iconName="DollarSign"
              accent={fees.outstandingAmount > 0 ? 'rose' : 'emerald'}
              subtitle={fees.outstandingAmount > 0 ? `${fees.pendingInvoices} invoice pending` : 'All cleared'}
            />
          </div>

          {/* Timetable, Results, Fees */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Timetable */}
              <TimetableWidget
                entries={childDashboard.timetable}
                title={`${childDashboard.student.name}'s Daily Schedule`}
              />

              {/* Recent Examination Results */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-700" />
                    Academic Results & Marks
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Official evaluations</span>
                </div>

                {childDashboard.recentResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No published results for this term yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {childDashboard.recentResults.map((result, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{result.subject}</div>
                          <div className="text-[11px] text-slate-500">{result.examName}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            {result.marksObtained} / {result.totalMarks}
                          </span>
                          <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Grade {result.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Attendance & Fee Notice */}
            <div className="space-y-6">
              <AttendanceSummary
                percentage={childDashboard.metrics.attendancePercentage}
                statusLabel={`${childDashboard.student.name}'s Attendance`}
              />

              {/* Fee Information Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    Tuition & Fee Statement
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {fees.currency}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                  <div className="text-xs text-slate-500">Balance Outstanding:</div>
                  <div className="text-2xl font-black text-slate-900">
                    {fees.outstandingAmount.toLocaleString()} {fees.currency}
                  </div>
                  {fees.lastPaymentDate && (
                    <div className="text-[11px] text-slate-400">Last payment: {fees.lastPaymentDate}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => alert('Online fee payment gateway will open.')}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Pay Dues Online
                </button>
              </div>

              <AnnouncementList announcements={announcements} title="Parent Announcements" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
          Select a child above to view their academic records and progress.
        </div>
      )}
    </div>
  );
}
