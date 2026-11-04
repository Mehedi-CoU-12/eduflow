'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { AccountantDashboardDto } from '@eduflow/types';
import { StatCard } from '../widgets/StatCard';
import { DollarSign, Layers, Clock, CheckCircle, CreditCard, BarChart2 } from 'lucide-react';

export function AccountantDashboard() {
  const { data: dashboard, isLoading, error } = useQuery<AccountantDashboardDto>({
    queryKey: ['dashboard', 'accountant'],
    queryFn: () => apiFetch<AccountantDashboardDto>('/dashboard/accountant'),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Failed to load financial records. Ensure your user profile holds accounting permissions.
      </div>
    );
  }

  const { metrics, feeStructuresCount, recentTransactions } = dashboard;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-cyan-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 border border-teal-600/50 text-xs font-semibold text-teal-200 mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              Institutional Financial Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Accounts & Fee Collection</h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
              Tuition fee schedules, student invoice generation, counter payment collection, and receipts.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-right">
            <div className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider">Currency</div>
            <div className="text-2xl font-black text-white">{metrics.currency}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected"
          value={`${(metrics.totalCollected / 1000).toFixed(0)}k ${metrics.currency}`}
          iconName="DollarSign"
          accent="teal"
          subtitle="Annual tuition & fees"
        />
        <StatCard
          label="Today's Collection"
          value={`${metrics.todayCollection.toLocaleString()} ${metrics.currency}`}
          iconName="CreditCard"
          accent="emerald"
          subtitle="Processed today"
        />
        <StatCard
          label="Outstanding Invoices"
          value={metrics.outstandingInvoices}
          iconName="Layers"
          accent="amber"
          subtitle="Pending student balances"
        />
        <StatCard
          label="Fee Structures"
          value={feeStructuresCount}
          iconName="BarChart2"
          accent="blue"
          subtitle="Class fee schedules"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            Recent Payment Transactions
          </h3>
          <span className="text-xs text-slate-500 font-medium">{recentTransactions.length} recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Admission #</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3.5 font-mono font-medium text-slate-900">{tx.id}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">{tx.studentName}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{tx.admissionNumber}</td>
                  <td className="px-6 py-3.5 font-extrabold text-slate-900">
                    {tx.amount.toLocaleString()} {tx.currency}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{tx.date}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
