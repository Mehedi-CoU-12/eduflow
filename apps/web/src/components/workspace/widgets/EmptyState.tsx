import React from 'react';
import * as LucideIcons from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof LucideIcons;
  badge?: string;
  features?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  iconName = 'Compass' as keyof typeof LucideIcons,
  badge = 'Planned Module',
  features,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Compass;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm max-w-2xl mx-auto space-y-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 mx-auto flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-teal-700" />
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {badge}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mt-2">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">{description}</p>
      </div>

      {features && features.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-lg text-left max-w-md mx-auto border border-slate-200/60 mt-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Planned Capabilities:</div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            {features.map((feat, i) => (
              <li key={i}>{feat}</li>
            ))}
          </ul>
        </div>
      )}

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
