'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/session';
import { GraduationCap, LogOut, Shield, School, User, Settings, Users, BookOpen, Clock } from 'lucide-react';

export function Navbar() {
  const { session, publicTenant, loading, logout } = useSession();

  const hostKind = publicTenant?.host ?? session?.host ?? 'root';
  const school = session?.tenant?.school ?? publicTenant?.school;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-teal-800 tracking-tight">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>EduFlow</span>
          </Link>

          {/* Context Badge */}
          {hostKind === 'platform' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              <Shield className="w-3.5 h-3.5" />
              Platform Admin
            </span>
          )}

          {hostKind === 'school' && school && (
            <div className="flex items-center gap-2">
              <span className="text-slate-300">/</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <School className="w-3.5 h-3.5" />
                {school.name}
              </span>
            </div>
          )}
        </div>

        {/* Navigation links for School host */}
        {hostKind === 'school' && session?.tenant && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-md hover:bg-slate-50 transition"
            >
              Overview
            </Link>
            <Link
              href="/members"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-md hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Members
            </Link>
            <Link
              href="/roles"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-md hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              Roles
            </Link>
            <Link
              href="/audit"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-md hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              Audit Log
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-md hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
        )}

        {/* User state */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-md" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-medium text-slate-600">
                  {session.user.avatarUrl ? (
                    <img
                      src={session.user.avatarUrl}
                      alt={session.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    session.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-semibold text-xs leading-none text-slate-900">{session.user.name}</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{session.user.email}</div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-teal-700 transition"
              >
                Sign In
              </Link>
              {hostKind === 'root' && (
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
