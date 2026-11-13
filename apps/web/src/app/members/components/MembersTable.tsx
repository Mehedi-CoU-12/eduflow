import React from 'react';
import type { MemberDto } from '@eduflow/types';
import { MemberRow } from './MemberRow';

interface MembersTableProps {
  members: MemberDto[];
  loading: boolean;
  onManageChildren: (member: MemberDto) => void;
  onEditRoles: (member: MemberDto) => void;
  onToggleStatus: (member: MemberDto) => void;
  onVerifyEmail: (member: MemberDto) => void;
  onRemove: (member: MemberDto) => void;
}

export function MembersTable({
  members,
  loading,
  onManageChildren,
  onEditRoles,
  onToggleStatus,
  onVerifyEmail,
  onRemove,
}: MembersTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Member</th>
              <th className="px-6 py-3">Roles</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Loading members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onManageChildren={onManageChildren}
                  onEditRoles={onEditRoles}
                  onToggleStatus={onToggleStatus}
                  onVerifyEmail={onVerifyEmail}
                  onRemove={onRemove}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
