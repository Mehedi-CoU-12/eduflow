'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  GuardianLinkDetailDto,
  LinkGuardianStudentInput,
  MemberDto,
  RoleDto,
  StudentProfileDto,
} from '@eduflow/types';
import { UserPlus, Search, AlertCircle, X, Heart, Trash2, CheckCircle, Plus } from 'lucide-react';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit roles modal
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  // Guardian management modal
  const [managingGuardianMember, setManagingGuardianMember] = useState<MemberDto | null>(null);

  const { data: membersData, isLoading: membersLoading } = useQuery<{ items: MemberDto[] }>({
    queryKey: ['members', search],
    queryFn: () =>
      apiFetch<{ items: MemberDto[] }>(`/members?limit=50${search ? `&q=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleDto[]>('/roles'),
  });

  const members = membersData?.items ?? [];
  const loading = membersLoading || rolesLoading;

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; name: string; roleIds: string[] }) =>
      apiFetch('/members/invite', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setSelectedRoleIds([]);
      setInviteError(null);
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ memberId, roleIds }: { memberId: string; roleIds: string[] }) =>
      apiFetch(`/members/${memberId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      setEditingMember(null);
      setEditError(null);
    },
    onError: (err: Error) => setEditError(err.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: string }) =>
      apiFetch(`/members/${memberId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiFetch(`/members/${memberId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const inviteSubmitting = inviteMutation.isPending;
  const editSubmitting = updateRolesMutation.isPending;

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

  const handleUpdateRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError(null);
    updateRolesMutation.mutate({
      memberId: editingMember.id,
      roleIds: editRoleIds,
    });
  };

  const handleToggleStatus = (member: MemberDto) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    toggleStatusMutation.mutate({ memberId: member.id, status: nextStatus });
  };

  const handleRemove = (member: MemberDto) => {
    if (!confirm(`Are you sure you want to remove ${member.user.name} from the school?`)) return;
    removeMemberMutation.mutate(member.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Members</h1>
          <p className="text-sm text-slate-500 mt-1">Staff, teachers, students, and guardians in this school.</p>
        </div>
        <button
          onClick={() => {
            setShowInviteModal(true);
            setInviteError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full text-sm bg-transparent focus:outline-none text-slate-800"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Roles</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-700 text-sm">
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm leading-tight">
                            {member.user.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              r.key === 'school_owner'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : r.key === 'school_admin'
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : member.status === 'invited'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.roles.some((r) => r.key === 'guardian') && (
                          <button
                            onClick={() => setManagingGuardianMember(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                            title="Manage Linked Children"
                          >
                            <Heart className="w-3 h-3 text-teal-600" />
                            Children
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setEditRoleIds(member.roles.map((r) => r.id));
                            setEditError(null);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                        >
                          Roles
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                        >
                          {member.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRemove(member)}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Invite Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
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
                          <div className="text-[11px] text-slate-400">{r.description || (r.isSystem ? 'System built-in' : 'Custom role')}</div>
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
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-60"
                >
                  {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Roles Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Roles</h3>
                <p className="text-xs text-slate-500">{editingMember.user.name}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
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
                        <div className="text-[11px] text-slate-400">{r.description || (r.isSystem ? 'System built-in' : 'Custom role')}</div>
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
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-60"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guardian Children Management Modal */}
      {managingGuardianMember && (
        <GuardianChildrenModal
          member={managingGuardianMember}
          onClose={() => setManagingGuardianMember(null)}
        />
      )}
    </div>
  );
}

function GuardianChildrenModal({
  member,
  onClose,
}: {
  member: MemberDto;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationship, setRelationship] = useState('Mother');
  const [isPrimary, setIsPrimary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: linkedChildren = [], isLoading: loadingLinked } = useQuery<GuardianLinkDetailDto[]>({
    queryKey: ['guardian-children', member.user.id],
    queryFn: () => apiFetch<GuardianLinkDetailDto[]>(`/guardians/${member.user.id}/students`),
  });

  const { data: allStudents = [] } = useQuery<StudentProfileDto[]>({
    queryKey: ['students-active'],
    queryFn: () => apiFetch<StudentProfileDto[]>('/students?status=active'),
  });

  // Filter out students already linked
  const availableStudents = allStudents.filter(
    (s) => !linkedChildren.some((c) => c.studentId === s.id),
  );

  const linkMutation = useMutation({
    mutationFn: (body: LinkGuardianStudentInput) =>
      apiFetch<GuardianLinkDetailDto>(`/guardians/${member.user.id}/students`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children', member.user.id] });
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
      apiFetch(`/guardians/${member.user.id}/students/${studentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children', member.user.id] });
      setSuccess('Child unlinked successfully.');
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
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
            <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
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
