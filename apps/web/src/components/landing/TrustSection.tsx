'use client';

import React from 'react';
import {
  Layers,
  Users2,
  ShieldCheck,
  Laptop,
  Building2,
  FileCheck2,
} from 'lucide-react';

export function TrustSection() {
  const values = [
    {
      icon: Layers,
      title: 'One Connected School Platform',
      description:
        'Unify admissions, academic schedules, examinations, attendance, and administrative oversight into a single operational system.',
      accent: 'teal',
    },
    {
      icon: Users2,
      title: 'Role-Based Experiences',
      description:
        'Principals, teachers, students, parents, and administrative staff each receive an interface tailored specifically to their daily responsibilities.',
      accent: 'blue',
    },
    {
      icon: ShieldCheck,
      title: 'Dedicated School Data Isolation',
      description:
        'Every institution operates inside its own protected tenant boundary. Your school’s records are strictly isolated and never mixed with others.',
      accent: 'emerald',
    },
    {
      icon: Laptop,
      title: 'Accessible From Anywhere',
      description:
        'Cloud-native web architecture enables school administrators, teachers in classrooms, and parents at home to stay informed on any device.',
      accent: 'purple',
    },
    {
      icon: Building2,
      title: 'Centralized Institutional Governance',
      description:
        'Standardize academic calendars, grading structures, section capacities, and faculty assignments across your entire organization.',
      accent: 'amber',
    },
    {
      icon: FileCheck2,
      title: 'Transparent & Auditable Records',
      description:
        'Track critical administrative actions, enrollment changes, and configuration updates with reliable audit records.',
      accent: 'rose',
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Institutional Advantages
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for the Daily Realities of Modern Education
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Running a school requires coordination across leadership, classrooms, administration, and families.
            EduFlow replaces scattered paper files and isolated spreadsheets with a cohesive, dependable platform.
          </p>
        </div>

        {/* Value Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group p-6 sm:p-7 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-teal-500/40 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center transition-colors duration-200 mb-5 shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
