import React from 'react';
import { Search } from 'lucide-react';

interface MembersSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function MembersSearchBar({ value, onChange }: MembersSearchBarProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <Search className="w-4 h-4 text-slate-400 ml-1" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full text-sm bg-transparent focus:outline-none text-slate-800"
      />
    </div>
  );
}
