'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  ClassDto,
  SectionRosterDto,
  TransferStudentsInput,
} from '@eduflow/types';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle,
  GraduationCap,
  Layers,
  Search,
  Users,
  X,
} from 'lucide-react';

export default function RosteringPage() {
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Queries
  const { data: classes = [] } = useQuery<ClassDto[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiFetch<ClassDto[]>('/academics/classes'),
  });

  // Auto-select first class and section if available and not selected
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const firstClass = classes[0];
      if (firstClass) {
        setSelectedClassId(firstClass.id);
        const firstSection = firstClass.sections?.[0];
        if (firstSection) {
          setSelectedSectionId(firstSection.id);
        }
      }
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const availableSections = selectedClass?.sections ?? [];

  const {
    data: rosterData,
    isLoading: rosterLoading,
  } = useQuery<SectionRosterDto>({
    queryKey: ['rostering', selectedSectionId],
    queryFn: () => apiFetch<SectionRosterDto>(`/rostering/sections/${selectedSectionId}/students`),
    enabled: Boolean(selectedSectionId),
  });

  const students = rosterData?.students ?? [];
  const sectionSummary = rosterData?.section;

  // Filter students in current view
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: (body: TransferStudentsInput) =>
      apiFetch<{ transferredCount: number; targetClassId: string; targetSectionId: string }>(
        '/rostering/transfer',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rostering'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['academics'] });
      setTransferSuccess(`Successfully transferred ${res.transferredCount} student(s)!`);
      setShowTransferModal(false);
      setSelectedStudentIds([]);
      setTargetClassId('');
      setTargetSectionId('');
      setTransferError(null);
    },
    onError: (err: Error) => {
      setTransferError(err.message);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || !targetSectionId) {
      setTransferError('Please select both a target class and section');
      return;
    }
    if (targetSectionId === selectedSectionId) {
      setTransferError('Target section must be different from current section');
      return;
    }

    transferMutation.mutate({
      studentIds: selectedStudentIds,
      targetClassId,
      targetSectionId,
    });
  };

  const targetClassObj = classes.find((c) => c.id === targetClassId);
  const targetSections = targetClassObj?.sections ?? [];
  const targetSectionObj = targetSections.find((s) => s.id === targetSectionId);

  // Capacity calculations
  const capacity = sectionSummary?.capacity ?? null;
  const enrolled = sectionSummary?.enrolledCount ?? 0;
  const occupancyPercent = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Classroom Section Rostering
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review class roster sizes, track section capacities, and reassign or transfer students
          between classroom sections.
        </p>
      </div>

      {/* Success Notification */}
      {transferSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{transferSuccess}</span>
          </div>
          <button
            onClick={() => setTransferSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class & Section Selector Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Class:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const nextClass = classes.find((c) => c.id === e.target.value);
                setSelectedSectionId(nextClass?.sections?.[0]?.id ?? '');
                setSelectedStudentIds([]);
              }}
              className="text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Section:
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setSelectedStudentIds([]);
              }}
              disabled={availableSections.length === 0}
              className="text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 disabled:opacity-50"
            >
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Capacity Indicator Pill */}
        {sectionSummary && (
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-right">
              <div className="text-xs text-slate-500">Section Occupancy</div>
              <div className="text-sm font-extrabold text-slate-900">
                {enrolled} {capacity ? `/ ${capacity} Students` : 'Students'}
              </div>
            </div>

            {capacity && (
              <div className="w-28">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (occupancyPercent ?? 0) >= 100
                        ? 'bg-rose-500'
                        : (occupancyPercent ?? 0) >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-right mt-0.5">
                  {occupancyPercent}% Filled
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster Controls & Multi-Select Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter section roster..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        {selectedStudentIds.length > 0 && (
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-lg text-teal-900 animate-in fade-in">
            <span className="text-xs font-bold">
              {selectedStudentIds.length} student(s) selected
            </span>
            <button
              onClick={() => {
                setShowTransferModal(true);
                setTransferError(null);
                setTargetClassId(selectedClassId);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 shadow-xs transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer Selected
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-teal-700 hover:text-teal-900 underline font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      selectedStudentIds.length === filteredStudents.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="px-6 py-3.5">Roll #</th>
                <th className="px-6 py-3.5">Admission #</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rosterLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading classroom roster...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No students currently enrolled in this section.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isSelected ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudent(student.id)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {student.rollNumber ? (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {student.rollNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {student.admissionNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm leading-tight">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Students Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Transfer Students</h3>
                  <p className="text-xs text-slate-500">
                    Reassigning {selectedStudentIds.length} student(s) from{' '}
                    <span className="font-semibold">{sectionSummary?.className} — {sectionSummary?.sectionName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Academic Class
                </label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value);
                    setTargetSectionId('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Select Destination Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Classroom Section
                </label>
                <select
                  required
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  disabled={!targetClassId}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 disabled:opacity-50"
                >
                  <option value="">Select Destination Section</option>
                  {targetSections.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === selectedSectionId}>
                      {s.name} {s.capacity ? `(Capacity: ${s.capacity})` : ''}
                      {s.id === selectedSectionId ? ' (Current Section)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {targetSectionObj?.capacity && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Target Section Capacity: <span className="font-bold">{targetSectionObj.capacity} students</span>.
                  Transfers will be validated against classroom capacity limits.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
