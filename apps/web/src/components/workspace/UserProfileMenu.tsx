'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown, Layers } from 'lucide-react';
import type { WorkspaceType } from '@eduflow/types';
import { WORKSPACE_METADATA } from '@/config/dashboard-config';

interface AvailableWorkspace {
  type: WorkspaceType;
  name: string;
  description: string;
  isPrimary: boolean;
}

interface UserProfileMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  currentWorkspace: WorkspaceType;
  availableWorkspaces: AvailableWorkspace[];
  onSwitchWorkspace: (workspace: WorkspaceType) => void;
  onLogout: () => void;
}

export function UserProfileMenu({
  user,
  currentWorkspace,
  availableWorkspaces,
  onSwitchWorkspace,
  onLogout,
}: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMeta = WORKSPACE_METADATA[currentWorkspace];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition"
      >
        <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
            {user.name}
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            {currentMeta?.badge || currentWorkspace}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-2 divide-y divide-slate-100">
          <div className="px-4 py-3">
            <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${currentMeta?.badgeClass}`}>
                {currentMeta?.badge || currentWorkspace}
              </span>
            </div>
          </div>

          {availableWorkspaces.length > 1 && (
            <div className="py-2 px-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                Switch Role View
              </div>
              <div className="space-y-1">
                {availableWorkspaces.map((ws) => (
                  <button
                    key={ws.type}
                    type="button"
                    onClick={() => {
                      onSwitchWorkspace(ws.type);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition ${
                      ws.type === currentWorkspace
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {WORKSPACE_METADATA[ws.type]?.badge || ws.name}
                    </span>
                    {ws.type === currentWorkspace && <span className="text-teal-700 font-bold">&bull;</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="py-1">
            <Link
              href={
                currentWorkspace === 'student'
                  ? '/?workspace=student&tab=profile'
                  : currentWorkspace === 'guardian'
                  ? '/?workspace=guardian&tab=children'
                  : '/settings'
              }
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {currentWorkspace === 'student' ? (
                <>
                  <User className="w-4 h-4 text-slate-400" />
                  My Student Profile
                </>
              ) : currentWorkspace === 'guardian' ? (
                <>
                  <User className="w-4 h-4 text-slate-400" />
                  Family & Children Profile
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings & Profile
                </>
              )}
            </Link>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
