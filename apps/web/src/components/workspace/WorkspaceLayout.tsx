'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/session';
import { apiFetch } from '@/lib/api';
import type { UserWorkspacesDto, WorkspaceType } from '@eduflow/types';
import { WORKSPACE_METADATA } from '@/config/dashboard-config';
import { getFilteredNavigation } from '@/config/workspace-navigation';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceHeader } from './WorkspaceHeader';
import type { BreadcrumbItem } from './Breadcrumbs';
import { ShieldAlert } from 'lucide-react';

interface AvailableWorkspace {
  type: WorkspaceType;
  name: string;
  description: string;
  isPrimary: boolean;
}

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  activeWorkspace?: WorkspaceType;
  onSwitchWorkspace?: (ws: WorkspaceType) => void;
}

export function WorkspaceLayout({
  children,
  activeWorkspace: propActiveWorkspace,
  onSwitchWorkspace: propOnSwitchWorkspace,
}: WorkspaceLayoutProps) {
  const { session, publicTenant, logout } = useSession();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const school = session?.tenant?.school ?? publicTenant?.school;
  const user = session?.user ?? { name: 'Member', email: '' };
  const userPermissions = session?.tenant?.permissions ?? [];

  // Fetch available workspaces for the authenticated member
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery<UserWorkspacesDto>({
    queryKey: ['dashboard', 'workspaces'],
    queryFn: () => apiFetch<UserWorkspacesDto>('/dashboard/workspaces'),
    enabled: Boolean(session?.tenant),
    staleTime: 60 * 1000,
  });

  const availableWorkspaces: AvailableWorkspace[] = workspacesData?.workspaces ?? [];
  const defaultWorkspace: WorkspaceType = workspacesData?.defaultWorkspace ?? 'admin';

  // Determine current active workspace:
  // 1. Explicit prop
  // 2. Query param ?workspace=...
  // 3. localStorage preference
  // 4. Default primary workspace from API
  const queryWorkspace = searchParams.get('workspace') as WorkspaceType | null;

  const storageKey = school ? `eduflow_active_ws_${school.id}` : null;
  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceType | null>(null);

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as WorkspaceType | null;
      if (stored) {
        if (availableWorkspaces.length > 0 && !availableWorkspaces.some((w) => w.type === stored)) {
          localStorage.setItem(storageKey, defaultWorkspace);
          setLocalWorkspace(defaultWorkspace);
        } else {
          setLocalWorkspace(stored);
        }
      }
    }
  }, [storageKey, availableWorkspaces, defaultWorkspace]);

  let currentWorkspace: WorkspaceType = propActiveWorkspace || defaultWorkspace;

  const validLocalWorkspace =
    localWorkspace &&
    (availableWorkspaces.length === 0 || availableWorkspaces.some((w) => w.type === localWorkspace))
      ? localWorkspace
      : null;

  if (queryWorkspace) {
    currentWorkspace = queryWorkspace;
  } else if (validLocalWorkspace) {
    currentWorkspace = validLocalWorkspace;
  }

  // Verify authorization: check if currentWorkspace is in availableWorkspaces
  const isAuthorized =
    availableWorkspaces.length === 0 ||
    availableWorkspaces.some((w) => w.type === currentWorkspace);

  const handleSwitchWorkspace = (ws: WorkspaceType) => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, ws);
    }
    setLocalWorkspace(ws);

    if (propOnSwitchWorkspace) {
      propOnSwitchWorkspace(ws);
    } else {
      router.push(`/?workspace=${ws}`);
    }
  };

  const meta = WORKSPACE_METADATA[currentWorkspace];
  const navigationSections = getFilteredNavigation(currentWorkspace, userPermissions);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: school?.name || 'School' },
    { label: meta?.badge || currentWorkspace },
  ];

  if (pathname && pathname !== '/') {
    const segment = pathname.replace(/^\//, '').split('/')[0]!;
    breadcrumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1) });
  } else {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== 'overview') {
      const activeItem = navigationSections
        .flatMap((s) => s.items)
        .find((item) => {
          const itemTab = new URLSearchParams(item.href.split('?')[1] || '').get('tab');
          return itemTab === currentTab;
        });
      if (activeItem) {
        breadcrumbs.push({ label: activeItem.label });
      }
    }
  }

  const searchString = searchParams?.toString();
  const currentFullPath = searchString ? `${pathname}?${searchString}` : (pathname || '/');

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Sidebar */}
      <WorkspaceSidebar
        schoolName={school?.name || 'EduFlow School'}
        schoolSlug={school?.slug || 'portal'}
        sections={navigationSections}
        currentPath={currentFullPath}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <WorkspaceHeader
          breadcrumbs={breadcrumbs}
          currentWorkspace={currentWorkspace}
          availableWorkspaces={availableWorkspaces}
          onSwitchWorkspace={handleSwitchWorkspace}
          user={user}
          onLogout={logout}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {!isAuthorized && !workspacesLoading ? (
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Workspace Access Restricted</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Your account does not possess the permissions or role assignments required to view the{' '}
                  <strong className="text-slate-800">{currentWorkspace}</strong> workspace.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchWorkspace(defaultWorkspace)}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition shadow-sm"
                >
                  Return to {WORKSPACE_METADATA[defaultWorkspace]?.badge || 'Authorized'} Workspace
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
