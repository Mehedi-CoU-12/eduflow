'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { LinkGuardianStudentInput, MemberDto, StudentProfileDto } from '@eduflow/types';
import { Heart, X, AlertCircle } from 'lucide-react';

interface LinkGuardianToStudentModalProps {
  student: StudentProfileDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LinkGuardianToStudentModal({
  student,
  onClose,
  onSuccess,
}: LinkGuardianToStudentModalProps) {
  const queryClient = useQueryClient();

  const [selectedGuardianUserId, setSelectedGuardianUserId] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active school members
  const { data: membersData, isLoading: loadingMembers } = useQuery<MemberDto[] | { items: MemberDto[] }>({
    queryKey: ['members-guardians-list'],
    queryFn: () => apiFetch<MemberDto[] | { items: MemberDto[] }>('/members?limit=100'),
    enabled: Boolean(student),
  });

  const members: MemberDto[] = Array.isArray(membersData)
    ? membersData
    : (membersData?.items ?? []);

  // Filter or prioritize members who hold the guardian role
  const guardianCandidates = members.filter((m) => m.status === 'active');

  const linkMutation = useMutation({
    mutationFn: (body: LinkGuardianStudentInput) =>
      apiFetch(`/guardians/${selectedGuardianUserId}/students`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', student?.id, 'guardians'] });
      queryClient.invalidateQueries({ queryKey: ['guardian-children'] });
      onClose();
      onSuccess?.();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (!student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianUserId) {
      setError('Please select a guardian user from the list.');
      return;
    }
    setError(null);
    linkMutation.mutate({
      studentId: student.id,
      relationship,
      isPrimary,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Link Family Guardian</h3>
              <p className="text-xs text-slate-500">For student: {student.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Guardian Account <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedGuardianUserId}
              onChange={(e) => setSelectedGuardianUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="">
                {loadingMembers ? 'Loading members...' : 'Select Guardian User'}
              </option>
              {guardianCandidates.map((m) => {
                const roleNames = m.roles.map((r) => r.name).join(', ');
                return (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.user.email}) - {roleNames || 'Member'}
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              If the guardian does not have an account yet, invite them first under Members & Staff.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Parent">Parent</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Mark as Primary Emergency Contact
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={linkMutation.isPending || !selectedGuardianUserId}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {linkMutation.isPending ? 'Linking...' : 'Confirm Guardian Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
