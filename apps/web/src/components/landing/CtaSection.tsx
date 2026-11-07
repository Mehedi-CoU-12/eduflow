'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white p-8 sm:p-14 lg:p-16 shadow-2xl">
          {/* Subtle Ambient Glows */}
          <div
            className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-700/80 border border-teal-500/40 text-xs font-semibold text-teal-200">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Modernize Your Institution Today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to simplify your school management?
            </h2>

            <p className="text-base sm:text-lg text-teal-100 max-w-2xl mx-auto leading-relaxed">
              Bring your school operations, teachers, students and parents together with EduFlow.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-teal-950 bg-white hover:bg-teal-50 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
              >
                <span>Get Started Today</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-semibold text-white hover:text-teal-200 bg-teal-800/80 hover:bg-teal-700/80 border border-teal-600/60 rounded-xl transition"
              >
                Sign In
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-teal-200 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" /> Dedicated school workspace
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" /> Role-based portals for all users
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" /> Isolated, protected student records
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
