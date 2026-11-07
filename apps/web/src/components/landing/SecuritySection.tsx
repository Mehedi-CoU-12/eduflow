'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Globe2,
  FileText,
  Database,
  KeyRound,
  CheckCircle,
} from 'lucide-react';

export function SecuritySection() {
  const benefits = [
    {
      icon: ShieldCheck,
      headline: "Every school's information stays protected and separate.",
      description:
        'Your students, staff records, and examination grades reside in dedicated database boundaries. No other school can ever view or access your private records.',
    },
    {
      icon: Lock,
      headline: 'Give each teacher, student, parent and staff member access to the information they need.',
      description:
        'Teachers only access their assigned classrooms; students and parents only view their own records; administrators maintain institutional oversight.',
    },
    {
      icon: Globe2,
      headline: 'Your school gets its own dedicated online workspace.',
      description:
        'Staff and parents access your portal through your unique school web address (e.g., yourschool.eduflow.app) ensuring institutional identity and trust.',
    },
    {
      icon: FileText,
      headline: 'Transparent and auditable administrative actions.',
      description:
        'Every critical update—such as grade entry, admission changes, or permission edits—creates an unalterable history trail for total institutional compliance.',
    },
  ];

  const technicalPillars = [
    {
      title: 'PostgreSQL Row Level Security (RLS)',
      desc: 'Database-enforced isolation ensuring queries execute strictly within the active school’s boundary.',
    },
    {
      title: 'Tenant-Aware Scoped Sessions',
      desc: 'Dual database connection roles separating regular application operations from administrative tasks.',
    },
    {
      title: 'Permission Scope Architecture',
      desc: 'Granular policy matrix verifying user permissions across own, assigned, and institutional scopes.',
    },
    {
      title: 'Append-Only Audit Logging',
      desc: 'Trigger-backed immutable event store providing verifiable accountability for sensitive actions.',
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 bg-slate-900 text-white scroll-mt-12 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div
        className="absolute -top-40 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold uppercase tracking-wider text-teal-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Security & Data Protection
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Institutional Protection Built into Every Layer
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            School administrators and parents trust you with sensitive personal and academic records.
            EduFlow delivers enterprise-grade protection without confusing technical hurdles.
          </p>
        </div>

        {/* 4 Benefit Cards Grid (Plain Language for School Leaders) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.headline}
                className="p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-teal-500/40 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5 border border-teal-500/20">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {item.headline}
                </h3>
                <p className="mt-2.5 text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Overview (For IT & Technical Evaluators) */}
        <div className="mt-12 bg-slate-800/50 rounded-2xl border border-slate-700/80 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Technical Architecture & Reliability Blueprint
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Engineered with modern relational database standards and strict separation of concerns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Zero Data Leakage Architecture
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicalPillars.map((pillar) => (
              <div key={pillar.title} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-teal-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-slate-200">{pillar.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
