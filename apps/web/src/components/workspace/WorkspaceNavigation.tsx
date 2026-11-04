'use client';

import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import type { NavSection } from '@/config/workspace-navigation';

interface WorkspaceNavigationProps {
  sections: NavSection[];
  currentPath: string;
  onNavigate?: () => void;
}

export function WorkspaceNavigation({ sections, currentPath, onNavigate }: WorkspaceNavigationProps) {
  return (
    <nav className="space-y-6">
      {sections.map((section, sIndex) => (
        <div key={sIndex} className="space-y-1">
          {section.title && (
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {section.title}
            </div>
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.Circle;
              const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
