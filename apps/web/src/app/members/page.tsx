'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { MemberDto, RoleDto } from '@eduflow/types';
import {
  MembersHeader,
  MembersSearchBar,
  MembersTable,
  InviteMemberModal,
  EditMemberRolesModal,
  GuardianChildrenModal,
} from './components';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null);
  const [managingGuardianMember, setManagingGuardianMember] = useState<MemberDto | null>(null);

  // Queries
  const { data: membersData, isLoading: membersLoading } = useQuery<MemberDto[] | { items: MemberDto[] }>({
    queryKey: ['members', search],
    queryFn: () =>
      apiFetch<MemberDto[] | { items: MemberDto[] }>(`/members?limit=50${search ? `&q=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleDto[]>('/roles'),
  });

  // Handle both array response and { items: MemberDto[] } response shape safely
  const members: MemberDto[] = Array.isArray(membersData)
    ? membersData
    : (membersData?.items ?? []);

  const loading = membersLoading || rolesLoading;

  // Mutations
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
      <MembersHeader onInviteClick={() => setShowInviteModal(true)} />

      <MembersSearchBar value={search} onChange={setSearch} />

      <MembersTable
        members={members}
        loading={loading}
        onManageChildren={(member) => setManagingGuardianMember(member)}
        onEditRoles={(member) => setEditingMember(member)}
        onToggleStatus={handleToggleStatus}
        onRemove={handleRemove}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roles={roles}
      />

      <EditMemberRolesModal
        member={editingMember}
        onClose={() => setEditingMember(null)}
        roles={roles}
      />

      <GuardianChildrenModal
        member={managingGuardianMember}
        onClose={() => setManagingGuardianMember(null)}
      />
    </div>
  );
}
