'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 text-slate-400 border-t border-slate-800 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">EduFlow</span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              EduFlow is a modern, multi-tenant School Management System (School ERP) connecting school leadership,
              teachers, students, and parents into one cohesive and secure digital workspace.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Multi-tenant data isolation &bull; Dedicated school workspaces</span>
            </div>
          </div>

          {/* Features Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Academic Structure
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Student Management
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Class Attendance
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Examinations & Marks
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Announcements
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  For Administrators
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  For Faculty & Teachers
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  For Parents & Guardians
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  For Enrolled Students
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  For Accounts & Staff
                </a>
              </li>
            </ul>
          </div>

          {/* Platform & Account Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform & Access</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors font-medium text-slate-300">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors font-medium text-teal-400">
                  Get Started / Create School
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Security & Reliability
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About EduFlow
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} EduFlow. All rights reserved. Built for modern educational institutions.
          </p>

          <div className="flex items-center gap-6">
            <a href="#security" className="hover:text-slate-300 transition-colors">
              Privacy & Data Isolation
            </a>
            <span className="text-slate-700">&bull;</span>
            <a href="#security" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
            <span className="text-slate-700">&bull;</span>
            <span className="text-slate-400">Initial focus: Bangladesh &bull; Globally extensible</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
