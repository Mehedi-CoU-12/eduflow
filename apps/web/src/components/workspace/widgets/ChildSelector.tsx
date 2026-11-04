import React from 'react';
import { Users, Check } from 'lucide-react';
import type { GuardianChildDto } from '@eduflow/types';

interface ChildSelectorProps {
  childrenList: GuardianChildDto[];
  selectedChildId: string | null;
  onSelectChild: (studentId: string) => void;
}

export function ChildSelector({ childrenList, selectedChildId, onSelectChild }: ChildSelectorProps) {
  if (childrenList.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-amber-700" />
          My Children ({childrenList.length})
        </div>
        <span className="text-[11px] text-slate-400">Select child to view academic records</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {childrenList.map((child) => {
          const isSelected = child.studentId === selectedChildId;
          return (
            <button
              key={child.studentId}
              type="button"
              onClick={() => onSelectChild(child.studentId)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-sm ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {child.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  {child.name}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                </div>
                <div className="text-[11px] text-slate-500">
                  {child.className} &bull; {child.sectionName}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
