'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  ClassDto,
  CreateFacultyAssignmentInput,
  EligibleTeacherDto,
  FacultyAssignmentDetailDto,
  SubjectDto,
} from '@eduflow/types';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Layers,
  Plus,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';

export default function FacultyAssignmentsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    teacherUserId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    isClassTeacher: boolean;
  }>({
    teacherUserId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    isClassTeacher: false,
  });

  // Queries
  const { data: teachers = [] } = useQuery<EligibleTeacherDto[]>({
    queryKey: ['faculty-assignments', 'teachers'],
    queryFn: () => apiFetch<EligibleTeacherDto[]>('/faculty-assignments/teachers'),
  });

  const { data: classes = [] } = useQuery<ClassDto[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiFetch<ClassDto[]>('/academics/classes'),
  });

  const { data: subjects = [] } = useQuery<SubjectDto[]>({
    queryKey: ['academics', 'subjects'],
    queryFn: () => apiFetch<SubjectDto[]>('/academics/subjects'),
  });

  const queryParams = new URLSearchParams();
  if (filterClassId) queryParams.set('classId', filterClassId);
  if (filterTeacherId) queryParams.set('teacherUserId', filterTeacherId);

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<
    FacultyAssignmentDetailDto[]
  >({
    queryKey: ['faculty-assignments', filterClassId, filterTeacherId],
    queryFn: () =>
      apiFetch<FacultyAssignmentDetailDto[]>(`/faculty-assignments?${queryParams.toString()}`),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: CreateFacultyAssignmentInput) =>
      apiFetch<FacultyAssignmentDetailDto>('/faculty-assignments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      setAssignSuccess(`Assigned ${data.teacherName} to ${data.className} — ${data.sectionName}`);
      setShowAssignModal(false);
      setFormData({
        teacherUserId: '',
        classId: '',
        sectionId: '',
        subjectId: '',
        isClassTeacher: false,
      });
      setAssignError(null);
    },
    onError: (err: Error) => {
      setAssignError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/faculty-assignments/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] });
      setAssignSuccess('Faculty assignment removed successfully.');
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const handleClassChange = (classId: string) => {
    setFormData((prev) => ({ ...prev, classId, sectionId: '' }));
  };

  const selectedClass = classes.find((c) => c.id === formData.classId);
  const availableSections = selectedClass?.sections ?? [];

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherUserId || !formData.classId || !formData.sectionId) {
      setAssignError('Please select a teacher, class, and section.');
      return;
    }

    createMutation.mutate({
      teacherUserId: formData.teacherUserId,
      sectionId: formData.sectionId,
      subjectId: formData.subjectId || null,
      isClassTeacher: formData.isClassTeacher,
    });
  };

  const handleUnassign = (assignment: FacultyAssignmentDetailDto) => {
    if (
      !confirm(
        `Are you sure you want to unassign ${assignment.teacherName} from ${assignment.className} — ${assignment.sectionName}?`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(assignment.id);
  };

  // Metrics
  const uniqueTeachersCount = new Set(assignments.map((a) => a.teacherUserId)).size;
  const classTeachersCount = assignments.filter((a) => a.isClassTeacher).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign teachers to classes and sections, appoint class teachers, and associate subject
            responsibilities.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAssignModal(true);
            setAssignError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Assign Faculty
        </button>
      </div>

      {/* Success Banner */}
      {assignSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{assignSuccess}</span>
          </div>
          <button
            onClick={() => setAssignSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{assignments.length}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Active Assignments
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{uniqueTeachersCount}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Deployed Teachers
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{classTeachersCount}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Class Teachers Appointed
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            <option value="">All Academic Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <select
            value={filterTeacherId}
            onChange={(e) => setFilterTeacherId(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          >
            <option value="">All Faculty Members</option>
            {teachers.map((t) => (
              <option key={t.userId} value={t.userId}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Teacher</th>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Assigned Subject</th>
                <th className="px-6 py-3.5">Position</th>
                <th className="px-6 py-3.5">Assigned Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignmentsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading faculty assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No faculty assignments found matching the selected filters.
                  </td>
                </tr>
              ) : (
                assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {asg.teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm leading-tight">
                            {asg.teacherName}
                          </div>
                          <div className="text-xs text-slate-500">{asg.teacherEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{asg.className}</div>
                      <div className="text-xs text-slate-500">{asg.sectionName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {asg.subjectName ? (
                        <div>
                          <span className="font-medium text-slate-800">{asg.subjectName}</span>
                          {asg.subjectCode && (
                            <span className="text-xs text-slate-400 ml-1.5 font-mono">
                              ({asg.subjectCode})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          General / All Subjects
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asg.isClassTeacher ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          Class Teacher
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Subject Teacher</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(asg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUnassign(asg)}
                        title="Unassign Teacher"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Faculty Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Assign Faculty Member</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Teacher <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.teacherUserId}
                  onChange={(e) => setFormData({ ...formData, teacherUserId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Choose Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.email}) — {t.assignmentCount} existing assignment(s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    disabled={!formData.classId}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 disabled:opacity-50"
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject (Optional)
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">All Subjects / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition">
                  <input
                    type="checkbox"
                    checked={formData.isClassTeacher}
                    onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Appoint as Primary Class Teacher
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Grants homeroom oversight for this classroom section.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Assigning...' : 'Assign Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
