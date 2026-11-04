'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers, ShieldAlert } from 'lucide-react';
import type { WorkspaceType } from '@eduflow/types';
import { WORKSPACE_METADATA } from '@/config/dashboard-config';

interface AvailableWorkspace {
  type: WorkspaceType;
  name: string;
  description: string;
  isPrimary: boolean;
}

interface WorkspaceSwitcherProps {
  workspaces: AvailableWorkspace[];
  currentWorkspace: WorkspaceType;
  onSwitchWorkspace: (workspace: WorkspaceType) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onSwitchWorkspace,
}: WorkspaceSwitcherProps) {
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

  if (workspaces.length <= 1) {
    const currentMeta = WORKSPACE_METADATA[currentWorkspace];
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
        <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
        <span>{currentMeta?.badge || 'Workspace'}</span>
      </div>
    );
  }

  const currentMeta = WORKSPACE_METADATA[currentWorkspace];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-white shadow-sm hover:shadow text-xs font-semibold text-slate-800 transition"
      >
        <Layers className="w-3.5 h-3.5 text-teal-700" />
        <span className="hidden sm:inline text-slate-500 font-normal">View:</span>
        <span className="font-bold text-slate-900">{currentMeta?.badge || currentWorkspace}</span>
        <span className="px-1.5 py-0.2 rounded-full bg-teal-50 text-[10px] text-teal-800 border border-teal-200 font-mono">
          {workspaces.length} roles
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 mt-2 w-72 rounded-xl bg-white shadow-lg border border-slate-200 z-50 py-2 divide-y divide-slate-100">
          <div className="px-3.5 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Workspace View
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              <span>Presentation only &bull; Permissions enforced by server</span>
            </div>
          </div>

          <div className="py-1">
            {workspaces.map((ws) => {
              const meta = WORKSPACE_METADATA[ws.type];
              const isSelected = ws.type === currentWorkspace;

              return (
                <button
                  key={ws.type}
                  type="button"
                  onClick={() => {
                    onSwitchWorkspace(ws.type);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left flex items-start justify-between gap-2 hover:bg-slate-50 transition ${
                    isSelected ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{meta?.badge || ws.name}</span>
                      {ws.isPrimary && (
                        <span className="px-1.5 py-0.2 text-[9px] font-medium bg-slate-100 text-slate-600 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ws.description}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
