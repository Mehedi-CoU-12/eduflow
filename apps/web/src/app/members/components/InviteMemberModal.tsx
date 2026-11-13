import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { RoleDto } from '@eduflow/types';
import { AlertCircle, X } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleDto[];
}

export function InviteMemberModal({ isOpen, onClose, roles }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const resetForm = () => {
    setInviteEmail('');
    setInviteName('');
    setSelectedRoleIds([]);
    setInviteError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; name: string; roleIds: string[] }) =>
      apiFetch('/members/invite', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      handleClose();
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  if (!isOpen) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoleIds.length === 0) {
      setInviteError('Please select at least one role');
      return;
    }
    setInviteError(null);
    inviteMutation.mutate({
      email: inviteEmail,
      name: inviteName,
      roleIds: selectedRoleIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Invite Member</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="jane@school.edu"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Assign Roles</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {roles.map((r) => {
                const isChecked = selectedRoleIds.includes(r.id);
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
                          setSelectedRoleIds((prev) => [...prev, r.id]);
                        } else {
                          setSelectedRoleIds((prev) => prev.filter((id) => id !== r.id));
                        }
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-60"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
