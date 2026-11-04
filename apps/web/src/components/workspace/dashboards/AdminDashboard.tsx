'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { AdminDashboardDto } from '@eduflow/types';
import { StatCard } from '../widgets/StatCard';
import { RecentActivities } from '../widgets/RecentActivities';
import { AttendanceSummary } from '../widgets/AttendanceSummary';
import {
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  Clock,
  Settings,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export function AdminDashboard() {
  const { data: dashboard, isLoading, error } = useQuery<AdminDashboardDto>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => apiFetch<AdminDashboardDto>('/dashboard/admin'),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Failed to load administrative overview. Ensure your account holds authorized permissions.
      </div>
    );
  }

  const { metrics, recentActivities, school } = dashboard;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 border border-teal-600/50 text-xs font-semibold text-teal-200 mb-2">
              <Shield className="w-3.5 h-3.5" />
              Institutional Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{school.name}</h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
              School governance, academic progress, admissions, and compliance monitoring.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/academics"
              className="px-4 py-2 bg-white text-teal-900 font-bold text-xs rounded-lg shadow-sm hover:bg-teal-50 transition"
            >
              Academic Config
            </Link>
            <Link
              href="/members"
              className="px-4 py-2 bg-teal-700/80 text-white font-bold text-xs rounded-lg border border-teal-600 hover:bg-teal-600 transition"
            >
              Manage Members
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={metrics.totalStudents}
          iconName="GraduationCap"
          accent="teal"
          subtitle="Enrolled student profiles"
        />
        <StatCard
          label="Total Teachers"
          value={metrics.totalTeachers}
          iconName="Users"
          accent="blue"
          subtitle="Assigned faculty members"
        />
        <StatCard
          label="Total Staff"
          value={metrics.totalStaff}
          iconName="UserCheck"
          accent="purple"
          subtitle="Administration & operations"
        />
        <StatCard
          label="Academic Structure"
          value={`${metrics.totalClasses} Classes`}
          iconName="Layers"
          accent="emerald"
          subtitle={`${metrics.totalSections} sections configured`}
        />
      </div>

      {/* Secondary Metrics & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AttendanceSummary
            percentage={metrics.studentAttendanceTodayPercentage}
            statusLabel="Institutional Rate"
          />

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operations & Schedule
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Pending Admissions</span>
                <span className="font-bold text-slate-900">{metrics.pendingAdmissions}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Upcoming Examinations</span>
                <span className="font-bold text-teal-800">{metrics.upcomingExaminations} scheduled</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Active Tenant Slug</span>
                <span className="font-mono text-slate-700">{school.slug}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Log Feed */}
        <div className="lg:col-span-2">
          <RecentActivities logs={recentActivities} title="Institutional Compliance & Audit Trail" />
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Access Portals
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/academics"
            className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-600/50 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs mt-2.5">Academic Years & Classes</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Terms, grade levels, sections, subjects.</p>
          </Link>

          <Link
            href="/members"
            className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-600/50 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs mt-2.5">Staff & Student Directory</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Faculty invites and role assignments.</p>
          </Link>

          <Link
            href="/roles"
            className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-600/50 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs mt-2.5">Access Control & Roles</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Custom permissions and scoping.</p>
          </Link>

          <Link
            href="/audit"
            className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-600/50 hover:shadow-sm transition"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs mt-2.5">Audit Log Compliance</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Non-repudiation security trail.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
