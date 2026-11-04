'use client';

import React from 'react';
import Link from 'next/link';
import { School, GraduationCap, X, ShieldCheck } from 'lucide-react';
import type { NavSection } from '@/config/workspace-navigation';
import { WorkspaceNavigation } from './WorkspaceNavigation';

interface WorkspaceSidebarProps {
  schoolName: string;
  schoolSlug: string;
  sections: NavSection[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceSidebar({
  schoolName,
  schoolSlug,
  sections,
  currentPath,
  isOpen,
  onClose,
}: WorkspaceSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Institution Header */}
        <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shrink-0 shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-slate-900 truncate leading-tight">
                {schoolName}
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate leading-tight flex items-center gap-1">
                <School className="w-3 h-3 text-slate-400" />
                {schoolSlug}
              </div>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <WorkspaceNavigation sections={sections} currentPath={currentPath} onNavigate={onClose} />
        </div>

        {/* Security & Tenant Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Multi-Tenant RLS Isolated</span>
          </div>
        </div>
      </aside>
    </>
  );
}
