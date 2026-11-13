import React from 'react';
import { UserPlus } from 'lucide-react';

interface MembersHeaderProps {
  onInviteClick: () => void;
}

export function MembersHeader({ onInviteClick }: MembersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Members</h1>
        <p className="text-sm text-slate-500 mt-1">Staff, teachers, students, and guardians in this school.</p>
      </div>
      <button
        onClick={onInviteClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
      >
        <UserPlus className="w-4 h-4" />
        Invite Member
      </button>
    </div>
  );
}
