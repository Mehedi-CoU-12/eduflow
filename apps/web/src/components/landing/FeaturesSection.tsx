'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  BellRing,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FeatureItem {
  name: string;
  isAvailable: boolean;
  note?: string;
}

interface FeatureCategory {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  description: string;
  accent: 'teal' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  features: FeatureItem[];
  outcome: string;
}

export function FeaturesSection() {
  const [filter, setFilter] = useState<'all' | 'academic' | 'operations' | 'services'>('all');

  const categories: FeatureCategory[] = [
    {
      id: 'academic',
      icon: BookOpen,
      tag: 'Academic Management',
      title: 'Structured Curriculum & Academic Calendar',
      description:
        'Establish and manage academic years, terms, grade levels, sections, and subject syllabi with full administrative control.',
      accent: 'teal',
      features: [
        { name: 'Multi-term academic year configuration', isAvailable: true },
        { name: 'Grade levels, classes, and section rosters', isAvailable: true },
        { name: 'Subject catalogs & elective assignments', isAvailable: true },
        { name: 'Faculty subject & class schedule mapping', isAvailable: true },
      ],
      outcome: 'Eliminate scheduling conflicts and maintain structured curricula across all grade levels.',
    },
    {
      id: 'students',
      icon: GraduationCap,
      tag: 'Student Management',
      title: 'Complete Student & Guardian Profiles',
      description:
        'A single source of truth for student records, enrollment status, guardian contacts, and institutional documents.',
      accent: 'blue',
      features: [
        { name: 'Comprehensive student profile records', isAvailable: true },
        { name: 'Guardian relationships & emergency contacts', isAvailable: true },
        { name: 'Admission number and enrollment tracking', isAvailable: true },
        { name: 'Student archiving & historical records', isAvailable: true },
      ],
      outcome: 'Keep entire student histories organized, accessible, and compliant from admission to graduation.',
    },
    {
      id: 'attendance',
      icon: CalendarCheck,
      tag: 'Attendance',
      title: 'Daily & Section-Level Attendance',
      description:
        'Fast and reliable attendance recording for teachers, with immediate visibility for school leadership and guardians.',
      accent: 'emerald',
      features: [
        { name: 'Class and section attendance tracking', isAvailable: true },
        { name: 'Institutional attendance rate metrics', isAvailable: true },
        { name: 'Role-scoped attendance dashboards', isAvailable: true },
        { name: 'Automated guardian SMS absence alerts', isAvailable: false, note: 'Roadmap' },
      ],
      outcome: 'Ensure classroom accountability and identify absenteeism patterns before they impact learning.',
    },
    {
      id: 'examinations',
      icon: Award,
      tag: 'Examinations & Grading',
      title: 'Exam Coordination & Marks Entry',
      description:
        'Schedule term examinations, collect subject marks from teachers, and publish verified academic results.',
      accent: 'amber',
      features: [
        { name: 'Exam schedule & calendar management', isAvailable: true },
        { name: 'Subject teacher marks entry portal', isAvailable: true },
        { name: 'Term result aggregation & verification', isAvailable: true },
        { name: 'Automated PDF report card generation', isAvailable: false, note: 'Roadmap' },
      ],
      outcome: 'Reduce errors in grade calculations and streamline the end-of-term reporting cycle.',
    },
    {
      id: 'finance',
      icon: CreditCard,
      tag: 'Finance & Accounts',
      title: 'Fee Invoicing & Payment Records',
      description:
        'Manage school fee schedules, tuition billing, fee collection receipts, and operational accounting.',
      accent: 'purple',
      features: [
        { name: 'Accountant role workspace & permissions', isAvailable: true },
        { name: 'Institutional fee structure definitions', isAvailable: false, note: 'Roadmap' },
        { name: 'Student invoices & tuition balance tracking', isAvailable: false, note: 'Roadmap' },
        { name: 'Online payment gateway integration', isAvailable: false, note: 'Roadmap' },
      ],
      outcome: 'Bring clarity to tuition collections and provide transparency for school leadership and families.',
    },
    {
      id: 'communication',
      icon: BellRing,
      tag: 'School Communication',
      title: 'Announcements & Institutional Updates',
      description:
        'Deliver timely announcements, school circulars, and notices directly to teachers, students, and guardians.',
      accent: 'rose',
      features: [
        { name: 'School-wide announcement broadcasts', isAvailable: true },
        { name: 'Targeted notices by role & grade level', isAvailable: true },
        { name: 'Dedicated parent portal notifications', isAvailable: true },
        { name: 'Two-way parent-teacher messaging', isAvailable: false, note: 'Roadmap' },
      ],
      outcome: 'Keep the entire school community connected and informed with zero missed notices.',
    },
  ];

  const filteredCategories = categories.filter((cat) => {
    if (filter === 'academic') return cat.id === 'academic' || cat.id === 'students';
    if (filter === 'operations') return cat.id === 'attendance' || cat.id === 'examinations';
    if (filter === 'services') return cat.id === 'finance' || cat.id === 'communication';
    return true;
  });

  return (
    <section id="features" className="py-20 sm:py-28 bg-slate-50/70 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold uppercase tracking-wider text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Comprehensive Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Every Module Your School Needs to Run Smoothly
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Designed specifically for school operations. We clearly distinguish live capabilities available today
            from upcoming modules on our product roadmap.
          </p>

          {/* Capability Filters */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                filter === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Modules
            </button>
            <button
              type="button"
              onClick={() => setFilter('academic')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                filter === 'academic'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Academic & Students
            </button>
            <button
              type="button"
              onClick={() => setFilter('operations')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                filter === 'operations'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Attendance & Exams
            </button>
            <button
              type="button"
              onClick={() => setFilter('services')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                filter === 'services'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Finance & Communication
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6 sm:p-7 flex-1 space-y-4">
                  {/* Category Pill & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
                      {category.tag}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                      <Icon className="w-5 h-5 text-teal-700" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{category.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{category.description}</p>
                  </div>

                  {/* Bulleted Capabilities with Honest Badges */}
                  <div className="pt-2 space-y-2.5">
                    {category.features.map((item) => (
                      <div key={item.name} className="flex items-start gap-2.5 text-xs text-slate-700">
                        {item.isAvailable ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                        )}
                        <span className="flex-1">
                          {item.name}
                          {!item.isAvailable && (
                            <span className="ml-1.5 inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              {item.note || 'Roadmap'}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Outcome Footer */}
                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">Outcome:</span> {category.outcome}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
