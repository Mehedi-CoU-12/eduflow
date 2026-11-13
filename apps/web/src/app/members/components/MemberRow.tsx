import React from 'react';
import type { MemberDto } from '@eduflow/types';
import { Heart } from 'lucide-react';

interface MemberRowProps {
  member: MemberDto;
  onManageChildren: (member: MemberDto) => void;
  onEditRoles: (member: MemberDto) => void;
  onToggleStatus: (member: MemberDto) => void;
  onRemove: (member: MemberDto) => void;
}

export function MemberRow({
  member,
  onManageChildren,
  onEditRoles,
  onToggleStatus,
  onRemove,
}: MemberRowProps) {
  const isGuardian = member.roles.some((r) => r.key === 'guardian');

  return (
    <tr className="hover:bg-slate-50/70 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-sm overflow-hidden flex-shrink-0">
            {member.user.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt={member.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              member.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm leading-tight truncate">
              {member.user.name}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{member.user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {member.roles.map((r) => (
            <span
              key={r.id}
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                r.key === 'school_owner'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : r.key === 'school_admin'
                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {r.name}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            member.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : member.status === 'invited'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {member.status}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
        {new Date(member.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {isGuardian && (
            <button
              onClick={() => onManageChildren(member)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 transition shadow-2xs"
              title="Manage Linked Children"
            >
              <Heart className="w-3 h-3 text-teal-600" />
              Children
            </button>
          )}
          <button
            onClick={() => onEditRoles(member)}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
          >
            Roles
          </button>
          <button
            onClick={() => onToggleStatus(member)}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
          >
            {member.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={() => onRemove(member)}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}
