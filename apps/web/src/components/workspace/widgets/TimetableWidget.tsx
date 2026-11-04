import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { TimetableEntry } from '@eduflow/types';

interface TimetableWidgetProps {
  entries: TimetableEntry[];
  title?: string;
  emptyMessage?: string;
}

export function TimetableWidget({
  entries,
  title = "Today's Schedule",
  emptyMessage = 'No scheduled sessions for today.',
}: TimetableWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700" />
          {title}
        </h3>
        <span className="text-xs text-slate-500 font-medium">{entries.length} periods</span>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">{emptyMessage}</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 hover:bg-slate-50/60 transition flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100">
                    {entry.period}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{entry.subject}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {entry.className} &bull; {entry.sectionName}
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {entry.time}
                </div>
                {entry.room && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {entry.room}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
