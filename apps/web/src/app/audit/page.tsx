'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { AuditLogDto } from '@eduflow/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AuditPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: auditData, isLoading: loading } = useQuery<{ items: AuditLogDto[] }>({
    queryKey: ['audit'],
    queryFn: () => apiFetch<{ items: AuditLogDto[] }>('/audit?limit=50'),
  });

  const logs = auditData?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">
          Append-only compliance log. Every action is signed and stored with actor context.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-10"></th>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entity Type</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-800">
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{entry.entityType}</td>
                        <td className="px-6 py-4">
                          {entry.actor ? (
                            <div className="text-xs">
                              <span className="font-semibold text-slate-800">{entry.actor.name}</span>
                              <span className="text-slate-400 ml-1 font-mono">({entry.actor.email})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">system</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{entry.ipAddress || '—'}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-8 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              {entry.before != null ? (
                                <div className="p-3 bg-white rounded-lg border border-slate-200">
                                  <div className="font-semibold text-slate-500 mb-1">State Before:</div>
                                  <pre className="text-[11px] overflow-x-auto text-slate-700">
                                    {JSON.stringify(entry.before, null, 2)}
                                  </pre>
                                </div>
                              ) : null}
                              {entry.after != null ? (
                                <div className="p-3 bg-white rounded-lg border border-slate-200">
                                  <div className="font-semibold text-slate-500 mb-1">State After:</div>
                                  <pre className="text-[11px] overflow-x-auto text-slate-700">
                                    {JSON.stringify(entry.after, null, 2)}
                                  </pre>
                                </div>
                              ) : null}
                              {entry.metadata != null ? (
                                <div className="col-span-full p-3 bg-white rounded-lg border border-slate-200">
                                  <div className="font-semibold text-slate-500 mb-1">Metadata:</div>
                                  <pre className="text-[11px] overflow-x-auto text-slate-700">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                  </pre>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
