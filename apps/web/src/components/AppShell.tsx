'use client';

import React, { Suspense } from 'react';
import { useSession } from '@/lib/session';
import { Navbar } from './Navbar';
import { WorkspaceLayout } from './workspace/WorkspaceLayout';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, publicTenant, loading } = useSession();

  const hostKind = publicTenant?.host ?? session?.host ?? 'root';
  const isSchoolMember = hostKind === 'school' && Boolean(session?.tenant);

  // If signed in to a school tenant, WorkspaceLayout manages the full role-aware workspace
  if (isSchoolMember) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
          </div>
        }
      >
        <WorkspaceLayout>{children}</WorkspaceLayout>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          EduFlow SaaS Platform &copy; {new Date().getFullYear()}. Enterprise Grade Multi-Tenant School
          Infrastructure.
        </p>
      </footer>
    </div>
  );
}
