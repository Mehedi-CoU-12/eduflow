'use client';

import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState<'students' | 'academics' | 'attendance' | 'results' | 'parent'>('students');

  return (
    <section id="preview" className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200/80 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold uppercase tracking-wider text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Interactive Product Tour
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See EduFlow in Action
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Explore authentic workflows built with EduFlow&apos;s clean design language and robust operational architecture.
          </p>

          {/* Interactive Navigation Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Records</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'academics'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Academic Config</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'results'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Examination Results</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parent')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'parent'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Parent Portal</span>
            </button>
          </div>
        </div>

        {/* Showcase Frame Container */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Top Bar with Demo Info */}
          <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
              <span className="font-bold text-slate-900">Greenwood International Academy</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 capitalize font-medium">{activeTab} Workspace Module</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-[11px] font-semibold text-slate-700">
                Illustrative Demo Preview
              </span>
            </div>
          </div>

          {/* Module Content Switcher */}
          <div className="p-6 sm:p-8">
            {/* 1. STUDENT MANAGEMENT PREVIEW */}
            {activeTab === 'students' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Student Directory & Profiles</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing Class 10 &bull; Section A &bull; 40 Enrolled Students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                      Admission Cohort 2026-27
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Admission No</th>
                        <th className="px-4 py-3">Class & Section</th>
                        <th className="px-4 py-3">Primary Guardian</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[11px]">
                            SR
                          </div>
                          Sarah Rahman
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">2026-0941</td>
                        <td className="px-4 py-3.5">Class 10 - Sec A</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">Mahmudur Rahman (Father)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">+880 1711-002233</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">
                            TA
                          </div>
                          Tanvir Ahmed
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">2026-0942</td>
                        <td className="px-4 py-3.5">Class 10 - Sec A</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">Nasrin Akter (Mother)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">+880 1812-445566</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[11px]">
                            FJ
                          </div>
                          Farhana Jahan
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">2026-0943</td>
                        <td className="px-4 py-3.5">Class 10 - Sec A</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">Kamrul Jahan (Father)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">+880 1913-778899</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ACADEMIC CONFIGURATION PREVIEW */}
            {activeTab === 'academics' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Academic Structure & Class Sections</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configured for 2026-2027 Academic Year &bull; Current Term 1
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800">
                      10 Classes &bull; 32 Sections
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Class 10 (Secondary)</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        3 Sections
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Section A (Science)</span>
                        <span className="font-semibold text-slate-800">40 Students</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Section B (Commerce)</span>
                        <span className="font-semibold text-slate-800">38 Students</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Section C (Arts)</span>
                        <span className="font-semibold text-slate-800">35 Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Class 9 (Secondary)</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        3 Sections
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Section A (Science)</span>
                        <span className="font-semibold text-slate-800">42 Students</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Section B (Commerce)</span>
                        <span className="font-semibold text-slate-800">40 Students</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Section C (Arts)</span>
                        <span className="font-semibold text-slate-800">36 Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Class 8 (Junior)</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        4 Sections
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>Section A & B</span>
                        <span className="font-semibold text-slate-800">82 Students</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Section C & D</span>
                        <span className="font-semibold text-slate-800">79 Students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ATTENDANCE PREVIEW */}
            {activeTab === 'attendance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Daily Attendance Marking Sheet</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Class 10 - Section A &bull; Period 1 (Homeroom)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      38 / 40 Present (95%)
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Sarah Rahman</p>
                        <p className="text-[11px] text-slate-500">Roll 01 &bull; ID 2026-0941</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white">Present</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Tanvir Ahmed</p>
                        <p className="text-[11px] text-slate-500">Roll 02 &bull; ID 2026-0942</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white">Present</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Farhana Jahan</p>
                        <p className="text-[11px] text-slate-500">Roll 03 &bull; ID 2026-0943</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500 text-white">Excused</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. EXAMINATION RESULTS PREVIEW */}
            {activeTab === 'results' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Mid-Term Examination Results</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Student: Sarah Rahman &bull; Class 10-A</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-700 text-white">
                      GPA 5.00 / 5.00 &bull; Grade A+
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Subject</th>
                        <th className="px-4 py-2.5">Total Marks</th>
                        <th className="px-4 py-2.5">Marks Obtained</th>
                        <th className="px-4 py-2.5">Letter Grade</th>
                        <th className="px-4 py-2.5 text-right">Grade Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-900">Higher Mathematics</td>
                        <td className="px-4 py-3">100</td>
                        <td className="px-4 py-3 font-semibold text-teal-800">94</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">A+</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">5.0</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-900">Physics</td>
                        <td className="px-4 py-3">100</td>
                        <td className="px-4 py-3 font-semibold text-teal-800">89</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">A+</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">5.0</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-900">English Language & Lit</td>
                        <td className="px-4 py-3">100</td>
                        <td className="px-4 py-3 font-semibold text-teal-800">86</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">A+</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">5.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. PARENT PORTAL PREVIEW */}
            {activeTab === 'parent' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                      MR
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Mahmudur Rahman</h3>
                      <p className="text-xs text-slate-500">Guardian Portal &bull; 2 Children Enrolled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Child: Sarah Rahman (Class 10-A)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Today&apos;s Status
                    </span>
                    <p className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Present in Class
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Recorded at 8:45 AM by Homeroom</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Latest Examination
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1">Mid-Term: GPA 5.00</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Full marksheet available</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Upcoming Event
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1">Annual Sports Day</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Friday, November 28</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
