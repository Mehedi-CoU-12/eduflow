'use client';

import React from 'react';
import {
  School,
  Layers,
  UserPlus,
  Users2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: School,
      title: 'Create Your School Account',
      description:
        'Register in minutes, choose your school name, and claim your dedicated online workspace with its own private subdomain.',
      tip: 'Immediate workspace provisioning',
    },
    {
      step: '02',
      icon: Layers,
      title: 'Configure Academic Structure',
      description:
        'Set up your academic calendar, terms, grade levels, sections, and subject curriculum to match your institution’s syllabus.',
      tip: 'Custom grade & section capacities',
    },
    {
      step: '03',
      icon: UserPlus,
      title: 'Invite Teachers & Staff',
      description:
        'Send secure invitations to faculty and administrative officers. Assign them tailored roles with appropriate access scopes.',
      tip: 'Fine-grained role assignment',
    },
    {
      step: '04',
      icon: Users2,
      title: 'Add Students & Guardians',
      description:
        'Admit students into section rosters and link parent profiles so families receive immediate updates and results.',
      tip: 'Student records & family linkage',
    },
    {
      step: '05',
      icon: CheckCircle2,
      title: 'Run Daily School Operations',
      description:
        'Start tracking classroom attendance, managing timetables, entering exam marks, and keeping your school community connected.',
      tip: 'Everything in one unified place',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Simple 5-Step Onboarding
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Your School Gets Started with EduFlow
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            From initial registration to full daily operations, our step-by-step onboarding gets your school running
            smoothly without complicated setup.
          </p>
        </div>

        {/* Process Flow - Desktop & Mobile */}
        <div className="mt-16 sm:mt-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-4 relative">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="flex flex-col bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 hover:bg-white hover:border-teal-500/50 hover:shadow-md transition-all relative group"
                >
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                      Step {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center border border-slate-200 shadow-xs transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed flex-1">
                    {item.description}
                  </p>

                  {/* Tip Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-teal-800">
                    &bull; {item.tip}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launch CTA Banner */}
        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition transform hover:-translate-y-0.5"
          >
            <span>Begin Step 1: Create School</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
