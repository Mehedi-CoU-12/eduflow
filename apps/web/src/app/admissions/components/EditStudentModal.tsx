'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { StudentProfileDto, UpdateStudentProfileInput } from '@eduflow/types';
import { Edit3, X, AlertCircle } from 'lucide-react';

interface EditStudentModalProps {
  student: StudentProfileDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditStudentModal({ student, onClose, onSuccess }: EditStudentModalProps) {
  const queryClient = useQueryClient();

  const [rollNumber, setRollNumber] = useState(student?.rollNumber || '');
  const [status, setStatus] = useState<StudentProfileDto['status']>(student?.status || 'active');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (student) {
      setRollNumber(student.rollNumber || '');
      setStatus(student.status || 'active');
      setError(null);
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: (body: UpdateStudentProfileInput) =>
      apiFetch<StudentProfileDto>(`/students/${student?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['rostering'] });
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
    setError(null);
    updateMutation.mutate({
      rollNumber: rollNumber.trim() || null,
      status: status as any,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Student Account</h3>
              <p className="text-xs text-slate-500">{student.name} &bull; {student.admissionNumber}</p>
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
              Class Roll Number
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 01, 02"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Assigned identifier in {student.className} - {student.sectionName}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enrollment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="active">Active (Enrolled)</option>
              <option value="transferred">Transferred to other section/institution</option>
              <option value="graduated">Graduated</option>
              <option value="archived">Archived</option>
            </select>
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
              disabled={updateMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
