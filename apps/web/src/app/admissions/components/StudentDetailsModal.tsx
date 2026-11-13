'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { GuardianLinkDetailDto, StudentProfileDto } from '@eduflow/types';
import {
  GraduationCap,
  X,
  User,
  Mail,
  Phone,
  Layers,
  Heart,
  CheckCircle,
  AlertCircle,
  Edit3,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';

interface StudentDetailsModalProps {
  student: StudentProfileDto | null;
  onClose: () => void;
  onEdit: (student: StudentProfileDto) => void;
  onLinkGuardian: (student: StudentProfileDto) => void;
  onVerifyEmail: (student: StudentProfileDto) => void;
  verifyingEmail?: boolean;
}

export function StudentDetailsModal({
  student,
  onClose,
  onEdit,
  onLinkGuardian,
  onVerifyEmail,
  verifyingEmail,
}: StudentDetailsModalProps) {
  const queryClient = useQueryClient();
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const studentId = student?.id;

  const { data: guardians = [], isLoading: loadingGuardians } = useQuery<GuardianLinkDetailDto[]>({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: () => apiFetch<GuardianLinkDetailDto[]>(`/students/${studentId}/guardians`),
    enabled: Boolean(studentId),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ guardianUserId, studentId }: { guardianUserId: string; studentId: string }) =>
      apiFetch(`/guardians/${guardianUserId}/students/${studentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
      setUnlinkError(null);
    },
    onError: (err: Error) => {
      setUnlinkError(err.message);
    },
  });

  if (!student) return null;

  const handleUnlink = (guardian: GuardianLinkDetailDto) => {
    if (!confirm(`Are you sure you want to unlink ${guardian.guardianName} (${guardian.relationship}) from ${student.name}?`)) {
      return;
    }
    unlinkMutation.mutate({
      guardianUserId: guardian.guardianUserId,
      studentId: student.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center text-xl font-black shrink-0 overflow-hidden shadow-xs">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{student.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    student.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : student.status === 'transferred'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <span>Admission: <strong className="font-mono text-slate-800">{student.admissionNumber}</strong></span>
                <span>&bull;</span>
                <span>Class: <strong>{student.className} - {student.sectionName}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email verification status notice */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-xs">
          <div className="flex items-center gap-2.5">
            {student.emailVerified ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-semibold text-slate-800">
                Email Status: {student.emailVerified ? 'Verified' : 'Unverified'}
              </span>
              <span className="text-slate-500 block text-[11px]">{student.email}</span>
            </div>
          </div>
          {!student.emailVerified && (
            <button
              onClick={() => onVerifyEmail(student)}
              disabled={verifyingEmail}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50"
            >
              {verifyingEmail ? 'Verifying...' : 'Verify Email Now'}
            </button>
          )}
        </div>

        {/* Account Details Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Student Account Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Roll Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {student.rollNumber || 'Unassigned'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {student.admissionNumber}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Placement</span>
              <span className="font-semibold text-slate-900 text-sm">
                {student.className} &bull; Section {student.sectionName}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Telephone</span>
              <span className="font-semibold text-slate-900 text-sm">
                {student.phone || 'None provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Guardians Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Linked Family & Guardians ({guardians.length})
              </h4>
              <p className="text-[11px] text-slate-500">Parents or guardians authorized to view this student profile</p>
            </div>
            <button
              onClick={() => onLinkGuardian(student)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Link Guardian
            </button>
          </div>

          {unlinkError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {unlinkError}
            </div>
          )}

          {loadingGuardians ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading linked guardians...</div>
          ) : guardians.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-400">
              No family or guardian contacts linked yet. Click "Link Guardian" to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {guardians.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{g.guardianName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {g.relationship}
                      </span>
                      {g.isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{g.guardianEmail}</div>
                  </div>

                  <button
                    onClick={() => handleUnlink(g)}
                    disabled={unlinkMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                    title="Unlink guardian"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onEdit(student);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 shadow-sm transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Student Details
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
