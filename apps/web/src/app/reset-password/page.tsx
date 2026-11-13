'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { GraduationCap, ArrowRight, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isInvite = searchParams.get('mode') === 'invite';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Missing password reset token');
      if (password !== confirmPassword) throw new Error('Passwords do not match');
      return apiFetch('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please try again or request a new link.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    resetMutation.mutate();
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invalid Reset Link</h2>
          <p className="text-xs text-slate-600">
            No reset token was provided. Please request a new password reset link.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isInvite ? 'Set Up Your Password' : 'Set New Password'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isInvite
              ? 'Create a secure password to activate your account and join the school'
              : 'Create a secure password for your EduFlow account'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-4">
            <CheckCircle className="w-8 h-8 text-teal-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {isInvite ? 'Account Activated Successfully' : 'Password Set Successfully'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {isInvite
                  ? 'Your password has been set and your account is active. You can now sign in with your credentials.'
                  : 'Your password has been set and your email is confirmed. You can now sign in with your credentials.'}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition shadow-sm"
            >
              Sign In Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password (min. 10 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {resetMutation.isPending
                ? isInvite
                  ? 'Activating Account...'
                  : 'Updating Password...'
                : isInvite
                ? 'Activate Account & Join'
                : 'Save New Password'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center text-xs text-slate-500">
            {isInvite ? (
              <>
                Already set up your password?{' '}
                <Link href="/login" className="text-teal-700 font-semibold hover:underline">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                Remembered your password?{' '}
                <Link href="/login" className="text-teal-700 font-semibold hover:underline">
                  Back to Sign In
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
