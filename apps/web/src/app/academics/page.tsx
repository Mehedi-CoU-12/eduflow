'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  AcademicYearDto,
  ClassDto,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSectionInput,
  CreateSubjectInput,
  CreateTermInput,
  SubjectDto,
  TermDto,
} from '@eduflow/types';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

type Tab = 'years' | 'classes' | 'subjects';

export default function AcademicsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('years');

  // Queries
  const {
    data: years = [],
    isLoading: yearsLoading,
    error: yearsError,
  } = useQuery<AcademicYearDto[]>({
    queryKey: ['academics', 'years'],
    queryFn: () => apiFetch<AcademicYearDto[]>('/academics/years'),
  });

  const {
    data: terms = [],
    isLoading: termsLoading,
    error: termsError,
  } = useQuery<TermDto[]>({
    queryKey: ['academics', 'terms'],
    queryFn: () => apiFetch<TermDto[]>('/academics/terms'),
  });

  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
  } = useQuery<ClassDto[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiFetch<ClassDto[]>('/academics/classes'),
  });

  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useQuery<SubjectDto[]>({
    queryKey: ['academics', 'subjects'],
    queryFn: () => apiFetch<SubjectDto[]>('/academics/subjects'),
  });

  const loading = yearsLoading || termsLoading || classesLoading || subjectsLoading;
  const loadError =
    yearsError instanceof Error
      ? yearsError.message
      : termsError instanceof Error
        ? termsError.message
        : classesError instanceof Error
          ? classesError.message
          : subjectsError instanceof Error
            ? subjectsError.message
            : null;

  // Modals
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [yearForm, setYearForm] = useState<CreateAcademicYearInput>({
    name: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
  });

  const [termForm, setTermForm] = useState<CreateTermInput>({
    academicYearId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
  });

  const [classForm, setClassForm] = useState<CreateClassInput>({
    name: '',
    code: '',
  });

  const [sectionForm, setSectionForm] = useState<CreateSectionInput>({
    classId: '',
    name: '',
    capacity: undefined,
  });

  const [subjectForm, setSubjectForm] = useState<CreateSubjectInput>({
    name: '',
    code: '',
    type: 'mandatory',
    creditHours: undefined,
  });

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: (input: CreateAcademicYearInput) =>
      apiFetch('/academics/years', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          startDate: new Date(input.startDate).toISOString(),
          endDate: new Date(input.endDate).toISOString(),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'years'] });
      setShowYearModal(false);
      setYearForm({ name: '', startDate: '', endDate: '', status: 'upcoming' });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/academics/years/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'years'] });
      await queryClient.invalidateQueries({ queryKey: ['academics', 'terms'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const createTermMutation = useMutation({
    mutationFn: (input: CreateTermInput) =>
      apiFetch('/academics/terms', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          startDate: new Date(input.startDate).toISOString(),
          endDate: new Date(input.endDate).toISOString(),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'terms'] });
      await queryClient.invalidateQueries({ queryKey: ['academics', 'years'] });
      setShowTermModal(false);
      setTermForm({ academicYearId: '', name: '', startDate: '', endDate: '', status: 'upcoming' });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteTermMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/academics/terms/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'terms'] });
      await queryClient.invalidateQueries({ queryKey: ['academics', 'years'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const createClassMutation = useMutation({
    mutationFn: (input: CreateClassInput) =>
      apiFetch('/academics/classes', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
      setShowClassModal(false);
      setClassForm({ name: '', code: '' });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const createSectionMutation = useMutation({
    mutationFn: (input: CreateSectionInput) =>
      apiFetch('/academics/sections', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          capacity: input.capacity ? Number(input.capacity) : undefined,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
      setShowSectionModal(false);
      setSectionForm({ classId: '', name: '', capacity: undefined });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/academics/sections/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'classes'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (input: CreateSubjectInput) =>
      apiFetch('/academics/subjects', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          creditHours: input.creditHours ? Number(input.creditHours) : undefined,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', type: 'mandatory', creditHours: undefined });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academics', 'subjects'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const submitting =
    createYearMutation.isPending ||
    createTermMutation.isPending ||
    createClassMutation.isPending ||
    createSectionMutation.isPending ||
    createSubjectMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Structure</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage academic years, terms, classes, sections, and subjects.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{loadError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('years')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'years'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Years & Terms
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'classes'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Classes & Sections
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'subjects'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: ACADEMIC YEARS & TERMS */}
          {activeTab === 'years' && (
            <div className="space-y-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowYearModal(true);
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  New Academic Year
                </button>
                {years.length > 0 && (
                  <button
                    onClick={() => {
                      setTermForm((prev) => ({ ...prev, academicYearId: years[0]?.id ?? '' }));
                      setShowTermModal(true);
                      setFormError(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    New Term
                  </button>
                )}
              </div>

              {years.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-900">No academic years yet</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Get started by creating your school&apos;s first academic year.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {years.map((year) => {
                    const yearTerms = terms.filter((t) => t.academicYearId === year.id);
                    return (
                      <div
                        key={year.id}
                        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-900">{year.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                year.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : year.status === 'upcoming'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {year.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {new Date(year.startDate).toLocaleDateString()} &mdash;{' '}
                              {new Date(year.endDate).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete academic year "${year.name}"?`)) {
                                  deleteYearMutation.mutate(year.id);
                                }
                              }}
                              title="Delete year"
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Terms under this year */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Terms ({yearTerms.length})
                          </div>
                          {yearTerms.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No terms defined for this year.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {yearTerms.map((term) => (
                                <div
                                  key={term.id}
                                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-semibold text-sm text-slate-900">{term.name}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {new Date(term.startDate).toLocaleDateString()} &mdash;{' '}
                                      {new Date(term.endDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        term.status === 'active'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {term.status}
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete term "${term.name}"?`)) {
                                          deleteTermMutation.mutate(term.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLASSES & SECTIONS */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowClassModal(true);
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  New Class
                </button>
                {classes.length > 0 && (
                  <button
                    onClick={() => {
                      setSectionForm((prev) => ({ ...prev, classId: classes[0]?.id ?? '' }));
                      setShowSectionModal(true);
                      setFormError(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    New Section
                  </button>
                )}
              </div>

              {classes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-900">No classes defined</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Add classes (e.g. Grade 1, Grade 10) and their sections.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{cls.name}</h3>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cls.code}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete class "${cls.name}" and its sections?`)) {
                              deleteClassMutation.mutate(cls.id);
                            }
                          }}
                          title="Delete class"
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Sections ({cls.sections?.length ?? 0})
                        </div>
                        {!cls.sections || cls.sections.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No sections configured.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {cls.sections.map((sec) => (
                              <div
                                key={sec.id}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium"
                              >
                                <span>{sec.name}</span>
                                {sec.capacity && (
                                  <span className="text-[10px] text-teal-600">({sec.capacity} cap)</span>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete section "${sec.name}"?`)) {
                                      deleteSectionMutation.mutate(sec.id);
                                    }
                                  }}
                                  className="text-teal-400 hover:text-red-600 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowSubjectModal(true);
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  New Subject
                </button>
              </div>

              {subjects.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-900">No subjects yet</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Add subjects taught across the curriculum (e.g. Mathematics, English).
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Subject</th>
                        <th className="px-6 py-3.5">Code</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5">Credit Hours</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-3.5 font-semibold text-slate-900">{sub.name}</td>
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{sub.code}</td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                sub.type === 'mandatory'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {sub.type}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {sub.creditHours ? `${sub.creditHours} hrs` : '&mdash;'}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete subject "${sub.name}"?`)) {
                                  deleteSubjectMutation.mutate(sub.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE YEAR MODAL */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Academic Year</h3>
              <button
                onClick={() => setShowYearModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createYearMutation.mutate(yearForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year Name (e.g. 2026-2027)
                </label>
                <input
                  type="text"
                  required
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={yearForm.startDate}
                    onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={yearForm.endDate}
                    onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={yearForm.status}
                  onChange={(e) =>
                    setYearForm({ ...yearForm, status: e.target.value as CreateAcademicYearInput['status'] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TERM MODAL */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Academic Term</h3>
              <button
                onClick={() => setShowTermModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTermMutation.mutate(termForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  required
                  value={termForm.academicYearId}
                  onChange={(e) => setTermForm({ ...termForm, academicYearId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name</label>
                <input
                  type="text"
                  required
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  placeholder="First Semester / Term 1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={termForm.startDate}
                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={termForm.endDate}
                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={termForm.status}
                  onChange={(e) =>
                    setTermForm({ ...termForm, status: e.target.value as CreateTermInput['status'] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Class</h3>
              <button
                onClick={() => setShowClassModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createClassMutation.mutate(classForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="Grade 10 / Class 6"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  placeholder="G-10"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Section</h3>
              <button
                onClick={() => setShowSectionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSectionMutation.mutate(sectionForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                <select
                  required
                  value={sectionForm.classId}
                  onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="Section A / Rose"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacity (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={sectionForm.capacity ?? ''}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      capacity: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="40"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Subject</h3>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSubjectMutation.mutate(subjectForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Mathematics / English Literature"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="MATH-101"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        type: e.target.value as CreateSubjectInput['type'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="elective">Elective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Hours (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={subjectForm.creditHours ?? ''}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        creditHours: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="3.0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-teal-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
