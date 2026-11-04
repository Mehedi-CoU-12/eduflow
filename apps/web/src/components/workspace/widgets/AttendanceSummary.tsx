import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface AttendanceSummaryProps {
  percentage: number;
  presentDays?: number;
  totalDays?: number;
  statusLabel?: string;
}

export function AttendanceSummary({
  percentage,
  presentDays,
  totalDays,
  statusLabel = 'Good Standing',
}: AttendanceSummaryProps) {
  const isHealthy = percentage >= 85;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          Attendance Overview
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isHealthy
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {statusLabel}
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-3xl font-extrabold text-slate-900">{percentage}%</span>
          {presentDays !== undefined && totalDays !== undefined && (
            <span className="text-xs text-slate-500 font-medium">
              {presentDays} of {totalDays} sessions
            </span>
          )}
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHealthy ? 'bg-teal-600' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
        <div>
          <span className="text-slate-400">Policy Requirement:</span>
          <span className="font-semibold text-slate-700 ml-1">75% minimum</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400">Status:</span>
          <span className={`font-semibold ml-1 ${isHealthy ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isHealthy ? 'Satisfactory' : 'Needs Attention'}
          </span>
        </div>
      </div>
    </div>
  );
}
