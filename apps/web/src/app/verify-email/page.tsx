'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { GraduationCap, ArrowRight, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (tokenValue: string) =>
      apiFetch('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ token: tokenValue }),
      }),
    onSuccess: () => {
      setStatus('success');
    },
    onError: (err: unknown) => {
      setStatus('error');
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('This verification link is invalid or has expired.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      apiFetch('/auth/email/resend', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      }),
    onSuccess: () => {
      setResendSuccess(true);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to resend verification email.');
      }
    },
  });

  useEffect(() => {
    if (token) {
      setStatus('loading');
      verifyMutation.mutate(token);
    } else {
      setStatus('idle');
    }
  }, [token]);

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Verification</h1>
          <p className="text-xs text-slate-500 mt-1">EduFlow Multi-Tenant Portal</p>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mx-auto" />
            <p className="text-sm font-medium text-slate-700">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-5 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-4">
            <CheckCircle className="w-10 h-10 text-teal-600 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Email Verified!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Your email address has been confirmed. You can now sign in and create or manage your school.
              </p>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 shadow-sm transition"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Verification Failed</p>
                <p className="mt-0.5">{errorMessage || 'The verification link is invalid or has expired.'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Need a new verification link?
              </h4>
              {resendSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  If your email exists, a new verification link has been sent to your inbox.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (resendEmail) resendMutation.mutate();
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="name@school.edu"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendMutation.isPending || !resendEmail}
                    className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
                  >
                    {resendMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
              )}
            </div>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-teal-700 font-semibold hover:underline">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>No Verification Token Provided</span>
              </div>
              <p className="mt-1 text-slate-600">
                Please click the verification link sent to your email inbox, or enter your email address below to receive a new one.
              </p>
            </div>

            {resendSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                If your email exists, a new verification link has been sent to your inbox.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (resendEmail) resendMutation.mutate();
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resendMutation.isPending || !resendEmail}
                  className="w-full py-2 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-60"
                >
                  {resendMutation.isPending ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-teal-700 font-semibold hover:underline">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
