import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { MemberDto, RoleDto } from '@eduflow/types';
import { AlertCircle, X } from 'lucide-react';

interface EditMemberRolesModalProps {
  member: MemberDto | null;
  onClose: () => void;
  roles: RoleDto[];
}

export function EditMemberRolesModal({ member, onClose, roles }: EditMemberRolesModalProps) {
  const queryClient = useQueryClient();
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setEditRoleIds(member.roles.map((r) => r.id));
      setEditError(null);
    }
  }, [member]);

  const updateRolesMutation = useMutation({
    mutationFn: ({ memberId, roleIds }: { memberId: string; roleIds: string[] }) =>
      apiFetch(`/members/${memberId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (err: Error) => setEditError(err.message),
  });

  if (!member) return null;

  const handleUpdateRoles = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    updateRolesMutation.mutate({
      memberId: member.id,
      roleIds: editRoleIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Edit Roles</h3>
            <p className="text-xs text-slate-500">{member.user.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {editError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateRoles} className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {roles.map((r) => {
              const isChecked = editRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                    isChecked ? 'bg-teal-50/50 border-teal-500 text-teal-900' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {r.description || (r.isSystem ? 'System built-in' : 'Custom role')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditRoleIds((prev) => [...prev, r.id]);
                      } else {
                        setEditRoleIds((prev) => prev.filter((id) => id !== r.id));
                      }
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateRolesMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-60"
            >
              {updateRolesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
