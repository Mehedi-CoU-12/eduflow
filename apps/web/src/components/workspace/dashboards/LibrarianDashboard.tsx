'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PlannedModuleDto } from '@eduflow/types';
import { EmptyState } from '../widgets/EmptyState';

export function LibrarianDashboard() {
  const { data: moduleData } = useQuery<PlannedModuleDto>({
    queryKey: ['dashboard', 'librarian'],
    queryFn: () => apiFetch<PlannedModuleDto>('/dashboard/librarian'),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-pink-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Library Workspace</h1>
        <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-xl">
          Book cataloging, barcode scanning, student lending circulation, and overdue returns.
        </p>
      </div>

      <EmptyState
        title={moduleData?.title || 'Library System'}
        description={
          moduleData?.description ||
          'Comprehensive digital library cataloging and circulation tracking is currently in development.'
        }
        iconName="BookOpen"
        badge="Planned Module"
        features={moduleData?.plannedFeatures}
      />
    </div>
  );
}
