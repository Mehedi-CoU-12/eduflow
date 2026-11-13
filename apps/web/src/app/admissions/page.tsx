'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  AdmitStudentInput,
  ClassDto,
  StudentProfileDto,
} from '@eduflow/types';
import {
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Layers,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

export default function AdmissionsPage() {
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitSuccessStudent, setAdmitSuccessStudent] = useState<StudentProfileDto | null>(null);
  const [admitError, setAdmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    classId: string;
    sectionId: string;
    admissionNumber: string;
    rollNumber: string;
    initialPassword: string;
    guardianEmail: string;
    guardianRelationship: string;
    verifyEmailImmediately: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    classId: '',
    sectionId: '',
    admissionNumber: '',
    rollNumber: '',
    initialPassword: '',
    guardianEmail: '',
    guardianRelationship: 'Parent',
    verifyEmailImmediately: false,
  });

  // Queries
  const { data: classes = [] } = useQuery<ClassDto[]>({
    queryKey: ['academics', 'classes'],
    queryFn: () => apiFetch<ClassDto[]>('/academics/classes'),
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('q', search);
  if (selectedClassId) queryParams.set('classId', selectedClassId);
  if (selectedSectionId) queryParams.set('sectionId', selectedSectionId);
  if (selectedStatus) queryParams.set('status', selectedStatus);

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentProfileDto[]>({
    queryKey: ['students', search, selectedClassId, selectedSectionId, selectedStatus],
    queryFn: () => apiFetch<StudentProfileDto[]>(`/students?${queryParams.toString()}`),
  });

  // Admit Mutation
  const admitMutation = useMutation({
    mutationFn: (body: AdmitStudentInput) =>
      apiFetch<StudentProfileDto>('/students/admit', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setAdmitSuccessStudent(data);
      setShowAdmitModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        classId: '',
        sectionId: '',
        admissionNumber: '',
        rollNumber: '',
        initialPassword: '',
        guardianEmail: '',
        guardianRelationship: 'Parent',
        verifyEmailImmediately: false,
      });
      setAdmitError(null);
    },
    onError: (err: Error) => {
      setAdmitError(err.message);
    },
  });

  const verifyStudentEmailMutation = useMutation({
    mutationFn: (studentId: string) =>
      apiFetch(`/students/${studentId}/verify-email`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const handleVerifyStudent = (student: StudentProfileDto) => {
    if (!confirm(`Manually verify email address for ${student.name} (${student.email})?`)) return;
    verifyStudentEmailMutation.mutate(student.id);
  };

  const handleClassChange = (classId: string) => {
    setFormData((prev) => ({ ...prev, classId, sectionId: '' }));
  };

  const selectedClass = classes.find((c) => c.id === formData.classId);
  const availableSections = selectedClass?.sections ?? [];

  const filterClass = classes.find((c) => c.id === selectedClassId);
  const filterSections = filterClass?.sections ?? [];

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.classId || !formData.sectionId) {
      setAdmitError('Please fill in student name, email, class, and section.');
      return;
    }

    const payload: AdmitStudentInput = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      classId: formData.classId,
      sectionId: formData.sectionId,
      admissionNumber: formData.admissionNumber.trim() || undefined,
      rollNumber: formData.rollNumber.trim() || undefined,
      initialPassword: formData.initialPassword.trim() || undefined,
      guardianEmail: formData.guardianEmail.trim() || undefined,
      guardianRelationship: formData.guardianRelationship.trim() || undefined,
      verifyEmailImmediately: formData.verifyEmailImmediately,
    };

    admitMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Admissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admit students, manage student identities, assign classroom sections, and link guardians.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdmitModal(true);
            setAdmitError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Admit Student
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{students.length}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Enrolled Students
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{classes.length}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Active Classes
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {classes.reduce((sum, c) => sum + (c.sections?.length ?? 0), 0)}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Class Sections
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {admitSuccessStudent && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">Student Admitted Successfully!</div>
              <div className="text-xs text-emerald-800 mt-0.5">
                <span className="font-semibold">{admitSuccessStudent.name}</span> has been admitted with
                Admission Number{' '}
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {admitSuccessStudent.admissionNumber}
                </span>{' '}
                and enrolled in {admitSuccessStudent.className} — {admitSuccessStudent.sectionName}.
              </div>
            </div>
          </div>
          <button
            onClick={() => setAdmitSuccessStudent(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or admission number..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setSelectedSectionId('');
          }}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>

        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          disabled={!selectedClassId}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 disabled:opacity-50"
        >
          <option value="">All Sections</option>
          {filterSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        >
          <option value="active">Active Students</option>
          <option value="transferred">Transferred</option>
          <option value="graduated">Graduated</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Admission #</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Roll #</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading student admissions...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No admitted students found matching the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {student.admissionNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
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
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm leading-tight truncate">
                            {student.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-500 truncate">{student.email}</span>
                            {student.emailVerified ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{student.className}</div>
                      <div className="text-xs text-slate-500">{student.sectionName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {student.rollNumber ? (
                        <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {student.rollNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : student.status === 'transferred'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!student.emailVerified && (
                        <button
                          onClick={() => handleVerifyStudent(student)}
                          disabled={verifyStudentEmailMutation.isPending}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-2xs disabled:opacity-50"
                          title="Manually verify email address"
                        >
                          Verify Email
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Student Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Admit New Student</h3>
              </div>
              <button
                onClick={() => setShowAdmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {admitError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{admitError}</span>
              </div>
            )}

            <form onSubmit={handleAdmitSubmit} className="space-y-4 mt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Student Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahim Hasan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@school.edu"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+880 1700 000000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.initialPassword}
                    onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                2. Classroom Placement
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Class <span className="text-rose-500">*</span>
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
                    Class Section <span className="text-rose-500">*</span>
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
                        {s.name} {s.capacity ? `(Capacity: ${s.capacity})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Admission # (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    placeholder="Leave empty for ADM-YYYY-XXXX"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Roll # (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                3. Optional Guardian Link
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Email
                  </label>
                  <input
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.guardianRelationship}
                    onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Parent">Parent</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verifyEmailImmediately}
                    onChange={(e) => setFormData({ ...formData, verifyEmailImmediately: e.target.checked })}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-700">Verify email address immediately</span>
                    <p className="text-[11px] text-slate-400">
                      Skip email verification so the student can sign in right away with their initial password.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {admitMutation.isPending ? 'Admitting...' : 'Complete Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
