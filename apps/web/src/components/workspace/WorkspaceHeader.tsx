'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import type { WorkspaceType } from '@eduflow/types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { NotificationMenu } from './NotificationMenu';
import { UserProfileMenu } from './UserProfileMenu';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

interface AvailableWorkspace {
  type: WorkspaceType;
  name: string;
  description: string;
  isPrimary: boolean;
}

interface WorkspaceHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  currentWorkspace: WorkspaceType;
  availableWorkspaces: AvailableWorkspace[];
  onSwitchWorkspace: (workspace: WorkspaceType) => void;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
}

export function WorkspaceHeader({
  breadcrumbs,
  currentWorkspace,
  availableWorkspaces,
  onSwitchWorkspace,
  user,
  onLogout,
  onToggleMobileSidebar,
}: WorkspaceHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb path */}
        <div className="truncate">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* Right actions: Switcher, Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <WorkspaceSwitcher
          workspaces={availableWorkspaces}
          currentWorkspace={currentWorkspace}
          onSwitchWorkspace={onSwitchWorkspace}
        />

        <NotificationMenu />

        <div className="h-6 w-px bg-slate-200" />

        <UserProfileMenu
          user={user}
          currentWorkspace={currentWorkspace}
          availableWorkspaces={availableWorkspaces}
          onSwitchWorkspace={onSwitchWorkspace}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
