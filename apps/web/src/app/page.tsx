'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/session';
import { apiFetch } from '@/lib/api';
import type {
  MyMembershipDto,
  PlatformOverviewDto,
  PlatformSchoolDto,
  UserWorkspacesDto,
  WorkspaceType,
} from '@eduflow/types';
import {
  School,
  ArrowRight,
  Plus,
} from 'lucide-react';

import { LandingPage } from '@/components/landing/LandingPage';
import { AdminDashboard } from '@/components/workspace/dashboards/AdminDashboard';
import { TeacherDashboard } from '@/components/workspace/dashboards/TeacherDashboard';
import { StudentDashboard } from '@/components/workspace/dashboards/StudentDashboard';
import { GuardianDashboard } from '@/components/workspace/dashboards/GuardianDashboard';
import { AccountantDashboard } from '@/components/workspace/dashboards/AccountantDashboard';
import { LibrarianDashboard } from '@/components/workspace/dashboards/LibrarianDashboard';
import { HRDashboard } from '@/components/workspace/dashboards/HRDashboard';

export default function HomePage() {
  const { session, publicTenant, loading } = useSession();

  const hostKind = publicTenant?.host ?? session?.host ?? 'root';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
      </div>
    );
  }

  // PLATFORM CONSOLE VIEW
  if (hostKind === 'platform') {
    return <PlatformView />;
  }

  // SCHOOL CONTEXT VIEW
  if (hostKind === 'school') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
          </div>
        }
      >
        <SchoolView />
      </Suspense>
    );
  }

  // ROOT / ACCOUNT CONTEXT VIEW
  return <RootView />;
}

// ----------------------------------------------------------------------------
// PLATFORM VIEW (admin.localhost)
// ----------------------------------------------------------------------------
function PlatformView() {
  const queryClient = useQueryClient();

  const { data: overview, isLoading: overviewLoading } = useQuery<PlatformOverviewDto>({
    queryKey: ['platform', 'overview'],
    queryFn: () => apiFetch<PlatformOverviewDto>('/platform/overview'),
  });

  const { data: schoolsData, isLoading: schoolsLoading } = useQuery<{ items: PlatformSchoolDto[] }>({
    queryKey: ['platform', 'schools'],
    queryFn: () => apiFetch<{ items: PlatformSchoolDto[] }>('/platform/schools?limit=25'),
  });

  const schools = schoolsData?.items ?? [];
  const loading = overviewLoading || schoolsLoading;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ schoolId, status }: { schoolId: string; status: string }) =>
      apiFetch(`/platform/schools/${schoolId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform'] });
    },
    onError: () => alert('Failed to update status'),
  });

  const toggleStatus = (schoolId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    toggleStatusMutation.mutate({ schoolId, status: nextStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Control Center</h1>
        <p className="text-sm text-slate-500 mt-1">Global operations, tenant status, and system metrics.</p>
      </div>

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Schools</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{overview.schools.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              {overview.schools.active} active &bull; {overview.schools.suspended} suspended
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Registered Users</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{overview.users.total}</div>
            <div className="text-xs text-slate-500 mt-1">Across all organizations</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security & Isolation</div>
            <div className="text-3xl font-extrabold text-teal-700 mt-2">RLS Active</div>
            <div className="text-xs text-slate-500 mt-1">Postgres 18 tenant boundaries</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Schools Directory</h2>
          <span className="text-xs text-slate-500">{schools.length} schools loaded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">School Name</th>
                <th className="px-6 py-3">Domain / Address</th>
                <th className="px-6 py-3">Country</th>
                <th className="px-6 py-3">Members</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                  <td className="px-6 py-4">
                    <a
                      href={school.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1 font-mono text-xs"
                    >
                      {school.slug}.localhost
                    </a>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{school.countryCode}</td>
                  <td className="px-6 py-4">{school.memberCount} members</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        school.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(school.id, school.status)}
                      className="text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 transition"
                    >
                      {school.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SCHOOL VIEW ({slug}.localhost)
// ----------------------------------------------------------------------------
function SchoolView() {
  const { session, publicTenant } = useSession();
  const searchParams = useSearchParams();
  const school = session?.tenant?.school ?? publicTenant?.school;

  const { data: workspacesData, isLoading } = useQuery<UserWorkspacesDto>({
    queryKey: ['dashboard', 'workspaces'],
    queryFn: () => apiFetch<UserWorkspacesDto>('/dashboard/workspaces'),
    enabled: Boolean(session?.tenant),
    staleTime: 60 * 1000,
  });

  // If not signed in on school subdomain, render prominent portal welcome & sign in CTA
  if (!session?.tenant) {
    return (
      <div className="py-16 md:py-24 text-center space-y-6 max-w-xl mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
          <School className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {school?.name || 'School Portal'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Welcome to the institutional workspace. Please sign in to access your role-based dashboard, classes, or student records.
          </p>
        </div>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition"
          >
            Sign In to School <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
      </div>
    );
  }

  const queryWorkspace = searchParams.get('workspace') as WorkspaceType | null;
  const storageKey = school ? `eduflow_active_ws_${school.id}` : null;
  const localWorkspace =
    typeof window !== 'undefined' && storageKey
      ? (localStorage.getItem(storageKey) as WorkspaceType | null)
      : null;

  const defaultWorkspace = workspacesData?.defaultWorkspace ?? 'admin';
  const activeWorkspace = queryWorkspace || localWorkspace || defaultWorkspace;

  const renderDashboard = () => {
    switch (activeWorkspace) {
      case 'owner':
      case 'admin':
      case 'principal':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'guardian':
        return <GuardianDashboard />;
      case 'accountant':
        return <AccountantDashboard />;
      case 'librarian':
        return <LibrarianDashboard />;
      case 'hr_staff':
        return <HRDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return <>{renderDashboard()}</>;
}

// ----------------------------------------------------------------------------
// ROOT VIEW (localhost)
// ----------------------------------------------------------------------------
function RootView() {
  const { session } = useSession();

  const { data: schools = [], isLoading: loading } = useQuery<MyMembershipDto[]>({
    queryKey: ['mySchools'],
    queryFn: () => apiFetch<MyMembershipDto[]>('/me/schools'),
    enabled: !!session,
  });

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Schools</h1>
          <p className="text-sm text-slate-500 mt-1">Select a school to open its workspace portal.</p>
        </div>
        <Link
          href="/schools/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New School
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 mt-4">No schools found</h3>
          <p className="text-sm text-slate-500 mt-1">You are not currently a member of any school.</p>
          <Link
            href="/schools/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm mt-5 transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First School
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schools.map((item) => (
            <a
              key={item.membershipId}
              href={item.school.url}
              className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-teal-600/50 hover:shadow-md transition block"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  {item.school.name.charAt(0)}
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mt-4 text-lg group-hover:text-teal-700 transition">
                {item.school.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{item.school.slug}.localhost</p>

              <div className="flex flex-wrap gap-1 mt-4">
                {item.roles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
                  >
                    {r.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-teal-700 mt-5 group-hover:translate-x-1 transition-transform">
                Open portal <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
