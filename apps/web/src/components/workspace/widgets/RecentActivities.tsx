import React from 'react';
import { History, ShieldCheck, User } from 'lucide-react';
import type { AuditLogDto } from '@eduflow/types';

interface RecentActivitiesProps {
  logs: AuditLogDto[];
  title?: string;
}

export function RecentActivities({ logs, title = 'Recent Institution Activity' }: RecentActivitiesProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-teal-700" />
          {title}
        </h3>
        <span className="text-xs text-slate-500 font-medium">{logs.length} logged events</span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No recent activity records.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50/60 transition flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-900 truncate">
                    {log.action}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{log.actor?.name || 'System Operator'}</span>
                  <span>&bull;</span>
                  <span className="text-slate-400">{log.entityType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
