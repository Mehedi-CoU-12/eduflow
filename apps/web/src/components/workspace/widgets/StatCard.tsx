import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  iconName?: keyof typeof LucideIcons;
  accent?: 'teal' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  change?: string;
  isPositive?: boolean;
}

export function StatCard({
  label,
  value,
  subtitle,
  iconName = 'Activity' as keyof typeof LucideIcons,
  accent = 'teal',
  change,
  isPositive = true,
}: StatCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Activity;

  const accentStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[accent];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${accentStyles}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        {change && (
          <span
            className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {change}
          </span>
        )}
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
    </div>
  );
}
