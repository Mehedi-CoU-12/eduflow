'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Calendar, FileText, Award, DollarSign } from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'announcement' | 'attendance' | 'exam' | 'fee';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      category: 'announcement',
      title: 'Term Schedule Finalized',
      message: 'Examination timetable is now published across portals.',
      time: '10m ago',
      read: false,
    },
    {
      id: 'n-2',
      category: 'attendance',
      title: 'Daily Attendance Recorded',
      message: 'Today attendance statistics synced successfully.',
      time: '1h ago',
      read: false,
    },
    {
      id: 'n-3',
      category: 'fee',
      title: 'Fee Payment Notice',
      message: 'Semester tuition invoicing cycle is active.',
      time: '2h ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <Bell className="w-3.5 h-3.5 text-teal-700" />;
      case 'attendance':
        return <Calendar className="w-3.5 h-3.5 text-blue-700" />;
      case 'exam':
        return <Award className="w-3.5 h-3.5 text-purple-700" />;
      case 'fee':
        return <DollarSign className="w-3.5 h-3.5 text-amber-700" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-mono text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-medium text-teal-700 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                  !item.read ? 'bg-teal-50/20' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
