'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PermissionDto, RoleDto } from '@eduflow/types';
import { Shield, Plus, Trash2, AlertCircle, X } from 'lucide-react';

export default function RolesPage() {
  const queryClient = useQueryClient();

  // Create role modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedGrants, setSelectedGrants] = useState<Record<string, 'all' | 'assigned' | 'own'>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RoleDto[]>('/roles'),
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery<PermissionDto[]>({
    queryKey: ['permissions'],
    queryFn: () => apiFetch<PermissionDto[]>('/permissions'),
  });

  const loading = rolesLoading || catalogLoading;

  const createRoleMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; grants: { key: string; scope: 'all' | 'assigned' | 'own' }[] }) =>
      apiFetch('/roles', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateModal(false);
      setRoleName('');
      setRoleDescription('');
      setSelectedGrants({});
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const submitting = createRoleMutation.isPending;

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/roles/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    const grantsList = Object.entries(selectedGrants).map(([key, scope]) => ({ key, scope }));
    if (grantsList.length === 0) {
      setError('Please select at least one permission grant');
      return;
    }

    setError(null);
    createRoleMutation.mutate({
      name: roleName,
      description: roleDescription || undefined,
      grants: grantsList,
    });
  };

  const handleDeleteRole = (role: RoleDto) => {
    if (!confirm(`Are you sure you want to delete custom role "${role.name}"?`)) return;
    deleteRoleMutation.mutate(role.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            System templates and custom roles with fine-grained data scopes.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        role.isSystem ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{role.name}</h3>
                      <div className="text-[11px] font-mono text-slate-400">
                        {role.key ? `key: ${role.key}` : 'Custom School Role'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      role.isSystem
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {role.isSystem ? 'System' : 'Custom'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3">{role.description || 'No description provided.'}</p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Granted Permissions ({role.grants.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                    {role.grants.map((grant) => (
                      <span
                        key={grant.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700"
                      >
                        <span>{grant.key}</span>
                        <span className="text-[9px] px-1 bg-white rounded border border-slate-200 font-semibold text-teal-700">
                          {grant.scope}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!role.isSystem && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Role
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Custom Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base">Create Custom Role</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Exam Coordinator"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Coordinates term exam evaluations and score publication"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Permissions & Scope</label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {catalog.map((perm) => {
                    const isGranted = Boolean(selectedGrants[perm.key]);
                    const currentScope = selectedGrants[perm.key] || perm.scopes[0] || 'all';

                    return (
                      <div
                        key={perm.key}
                        className={`p-2.5 rounded-lg border transition ${
                          isGranted ? 'bg-white border-teal-500 shadow-sm' : 'bg-white/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGrants((prev) => ({
                                    ...prev,
                                    [perm.key]: perm.scopes.includes('all') ? 'all' : (perm.scopes[0] ?? 'own'),
                                  }));
                                } else {
                                  setSelectedGrants((prev) => {
                                    const next = { ...prev };
                                    delete next[perm.key];
                                    return next;
                                  });
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <div>
                              <div className="font-mono text-xs font-semibold text-slate-800">{perm.key}</div>
                              <div className="text-[11px] text-slate-500">{perm.description}</div>
                            </div>
                          </label>

                          {isGranted && (
                            <select
                              value={currentScope}
                              onChange={(e) => {
                                const newScope = e.target.value as 'all' | 'assigned' | 'own';
                                setSelectedGrants((prev) => ({ ...prev, [perm.key]: newScope }));
                              }}
                              className="text-xs font-mono font-medium border border-slate-300 rounded px-2 py-1 bg-white text-teal-800 focus:outline-none"
                            >
                              {perm.scopes.map((s) => (
                                <option key={s} value={s}>
                                  scope: {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
