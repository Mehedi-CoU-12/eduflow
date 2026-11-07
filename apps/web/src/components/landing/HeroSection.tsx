'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  School,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'exams'>('overview');

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-teal-50/20 to-white">
      {/* Background Subtle Gradient Accents */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-100/40 via-emerald-50/20 to-transparent blur-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-xs font-semibold text-teal-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Modern School Management &bull; Multi-Tenant SaaS ERP</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Your Entire School,{' '}
            <span className="text-teal-700 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              One Platform.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Manage students, teachers, classes, attendance, examinations and school administration from one connected
            platform. Spend less time on paperwork and more time helping students succeed.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-md shadow-teal-700/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Create Your School</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 hover:text-teal-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition-all"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Key Value Micro-Points */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Dedicated School Subdomain
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Role-Based Access for Everyone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Isolated & Secure Tenant Data
            </span>
          </div>
        </div>

        {/* Realistic Dashboard Showcase Window */}
        <div className="mt-14 sm:mt-18 relative">
          {/* Subtle Outer Frame / Glow */}
          <div className="relative mx-auto rounded-2xl p-1.5 sm:p-2.5 bg-gradient-to-b from-slate-200/90 via-slate-100/60 to-slate-200/80 shadow-2xl shadow-slate-900/10 border border-slate-200/80">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200/90">
              {/* Dashboard Browser Chrome Bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                  </div>
                  <div className="ml-3 hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600 font-mono">
                    <span className="text-teal-700 font-semibold">https://</span>greenwood-academy.eduflow.app
                  </div>
                </div>

                {/* Demo Data Disclaimer Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Illustrative Demo Preview
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <School className="w-3.5 h-3.5 text-teal-700" /> Greenwood Academy
                  </span>
                </div>
              </div>

              {/* Realistic Inner Dashboard Content */}
              <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/60 space-y-6">
                {/* School Profile Header */}
                <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-800/90 border border-teal-600/50 text-[11px] font-semibold text-teal-200 mb-2">
                        <span>Academic Term 2026-2027 &bull; Active</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Greenwood International Academy</h2>
                      <p className="text-teal-100 text-xs sm:text-sm mt-0.5">
                        School Administration Dashboard &bull; Daily Operations & Academic Performance
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'overview'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('academics')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'academics'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700'
                        }`}
                      >
                        Academics
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('exams')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'exams'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700'
                        }`}
                      >
                        Examinations
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Representative Statistics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">1,248</div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <span>&bull;</span> Enrolled across 10 grade levels
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Teachers</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">68</div>
                    <p className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
                      <span>&bull;</span> Faculty assigned across 32 sections
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Today</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">96.2%</div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <span>&bull;</span> 1,201 present &bull; 47 absent
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes & Sections</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">10 Classes</div>
                    <p className="text-[11px] text-purple-600 font-medium mt-1 flex items-center gap-1">
                      <span>&bull;</span> 32 sections &bull; 48 subjects
                    </p>
                  </div>
                </div>

                {/* Secondary Row: Attendance & Exams + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Attendance & Scheduled Exams */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Today&apos;s Attendance
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          96.2%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '96.2%' }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>1,201 Present</span>
                        <span>28 Excused</span>
                        <span>19 Absent</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Upcoming Examinations
                        </span>
                        <span className="text-[11px] font-semibold text-teal-700">Term 1</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">Mathematics & Higher Math</p>
                            <p className="text-[11px] text-slate-500">Class 9 & 10 &bull; Section A, B, C</p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                            In 4 days
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">Physics & General Science</p>
                            <p className="text-[11px] text-slate-500">Class 8 &bull; Section A & B</p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                            In 7 days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail & Operational Feed */}
                  <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          School Activity & Operational Trail
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Live school feed</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <div className="py-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">
                            Student Admission Enrolled:{' '}
                            <span className="font-normal text-slate-600">
                              Sarah Rahman was enrolled in Class 9-A (ID: 2026-0941).
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">14 minutes ago &bull; Admissions Officer</p>
                        </div>
                      </div>

                      <div className="py-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">
                            Faculty Assignment Updated:{' '}
                            <span className="font-normal text-slate-600">
                              Mohammad Hasan assigned as Lead Teacher for Class 10 Higher Math.
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">1 hour ago &bull; Academic Coordinator</p>
                        </div>
                      </div>

                      <div className="py-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">
                            Section Attendance Recorded:{' '}
                            <span className="font-normal text-slate-600">
                              Class 10-A attendance confirmed (38/40 present).
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">3 hours ago &bull; Homeroom Faculty</p>
                        </div>
                      </div>

                      <div className="py-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">
                            Academic Calendar Configured:{' '}
                            <span className="font-normal text-slate-600">
                              Mid-Term Examination schedule published for Class 6 through 10.
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Yesterday &bull; Principal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
