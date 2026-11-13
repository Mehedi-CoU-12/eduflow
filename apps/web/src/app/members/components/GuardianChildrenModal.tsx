import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  GuardianLinkDetailDto,
  LinkGuardianStudentInput,
  MemberDto,
  StudentProfileDto,
} from '@eduflow/types';
import { AlertCircle, CheckCircle, Heart, Plus, Trash2, X } from 'lucide-react';

interface GuardianChildrenModalProps {
  member: MemberDto | null;
  onClose: () => void;
}

export function GuardianChildrenModal({ member, onClose }: GuardianChildrenModalProps) {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationship, setRelationship] = useState('Mother');
  const [isPrimary, setIsPrimary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const guardianUserId = member?.user.id;

  const { data: linkedChildren = [], isLoading: loadingLinked } = useQuery<GuardianLinkDetailDto[]>({
    queryKey: ['guardian-children', guardianUserId],
    queryFn: () => apiFetch<GuardianLinkDetailDto[]>(`/guardians/${guardianUserId}/students`),
    enabled: !!guardianUserId,
  });

  const { data: allStudents = [] } = useQuery<StudentProfileDto[]>({
    queryKey: ['students-active'],
    queryFn: () => apiFetch<StudentProfileDto[]>('/students?status=active'),
    enabled: !!guardianUserId,
  });

  // Filter out students already linked
  const availableStudents = allStudents.filter(
    (s) => !linkedChildren.some((c) => c.studentId === s.id),
  );

  const linkMutation = useMutation({
    mutationFn: (body: LinkGuardianStudentInput) =>
      apiFetch<GuardianLinkDetailDto>(`/guardians/${guardianUserId}/students`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children', guardianUserId] });
      setSuccess(`Linked ${data.studentName} as ${data.relationship}!`);
      setSelectedStudentId('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (studentId: string) =>
      apiFetch(`/guardians/${guardianUserId}/students/${studentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children', guardianUserId] });
      setSuccess('Child unlinked successfully.');
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  if (!member) return null;

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student to link.');
      return;
    }
    setError(null);
    linkMutation.mutate({
      studentId: selectedStudentId,
      relationship,
      isPrimary,
    });
  };

  const handleUnlink = (child: GuardianLinkDetailDto) => {
    if (!confirm(`Are you sure you want to unlink ${child.studentName}?`)) return;
    unlinkMutation.mutate(child.studentId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Guardian Relationship Manager</h3>
              <p className="text-xs text-slate-500">
                Managing children linked to <span className="font-semibold text-slate-800">{member.user.name}</span> ({member.user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Existing Linked Children Section */}
        <div className="mt-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Linked Children ({linkedChildren.length})
          </div>

          {loadingLinked ? (
            <div className="text-xs text-slate-400 py-4 text-center">Loading linked children...</div>
          ) : linkedChildren.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No children currently linked to this guardian.
            </div>
          ) : (
            <div className="space-y-2">
              {linkedChildren.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{child.studentName}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {child.studentAdmissionNumber}
                      </span>
                      {child.isPrimary && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          Primary Guardian
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {child.className} — {child.sectionName} &bull; Relationship:{' '}
                      <span className="font-medium text-slate-700">{child.relationship}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnlink(child)}
                    disabled={unlinkMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Unlink Child"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link New Student Form */}
        <form onSubmit={handleLinkSubmit} className="mt-6 pt-5 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Link New Student
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="">Choose Student in this School</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admissionNumber}) — {s.className} ({s.sectionName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship Role
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              >
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Parent">Parent</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Relative / Other">Relative / Other</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                Primary Contact for Child
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={linkMutation.isPending || !selectedStudentId}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {linkMutation.isPending ? 'Linking...' : 'Link Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
