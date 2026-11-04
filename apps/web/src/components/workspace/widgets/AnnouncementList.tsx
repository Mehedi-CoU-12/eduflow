import React from 'react';
import { Bell, AlertCircle, Info } from 'lucide-react';
import type { AnnouncementItem } from '@eduflow/types';

interface AnnouncementListProps {
  announcements: AnnouncementItem[];
  title?: string;
}

export function AnnouncementList({ announcements, title = 'School Notices & Announcements' }: AnnouncementListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-700" />
          {title}
        </h3>
        <span className="text-xs text-slate-500 font-medium">{announcements.length} updates</span>
      </div>

      {announcements.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">No active notices at this time.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {announcements.map((item) => {
            const isImportant = item.priority === 'important' || item.priority === 'urgent';
            return (
              <div key={item.id} className="p-4 hover:bg-slate-50/60 transition space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isImportant ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{item.title}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">{item.date}</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{item.content}</p>
                <div className="pl-6 text-[11px] text-slate-400 font-medium">Issued by: {item.author}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
