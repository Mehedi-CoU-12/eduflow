'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PlannedModuleDto } from '@eduflow/types';
import { EmptyState } from '../widgets/EmptyState';
import { StatCard } from '../widgets/StatCard';

export function HRDashboard() {
  const { data: moduleData } = useQuery<PlannedModuleDto>({
    queryKey: ['dashboard', 'hr'],
    queryFn: () => apiFetch<PlannedModuleDto>('/dashboard/hr'),
    staleTime: 60 * 1000,
  });

  const staffCount = moduleData?.metrics?.['Active Staff Members'] ?? 0;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Human Resources & Staff</h1>
        <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl">
          Faculty and staff directory, workforce attendance, employee records, and payroll processing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Staff Members"
          value={staffCount}
          iconName="Users"
          accent="slate"
          subtitle="Registered staff directory"
        />
        <StatCard
          label="Pending Leave Requests"
          value={0}
          iconName="Clock"
          accent="amber"
          subtitle="Planned module"
        />
        <StatCard
          label="Payroll Cycles"
          value={0}
          iconName="DollarSign"
          accent="blue"
          subtitle="Planned module"
        />
      </div>

      <EmptyState
        title={moduleData?.title || 'Human Resources & Payroll'}
        description={
          moduleData?.description ||
          'Institutional workforce management, staff biometric attendance, leaves, and payroll records are planned.'
        }
        iconName="Briefcase"
        badge="Planned Module"
        features={moduleData?.plannedFeatures}
      />
    </div>
  );
}
