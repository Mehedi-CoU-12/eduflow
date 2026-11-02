'use client';

import React, { useState } from 'react';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { COUNTRIES, type SchoolDto } from '@eduflow/types';
import { School, ArrowRight, AlertCircle } from 'lucide-react';

export default function NewSchoolPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [countryCode, setCountryCode] = useState('BD');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [currencyCode, setCurrencyCode] = useState('BDT');
  const [defaultLocale, setDefaultLocale] = useState<'en' | 'bn'>('en');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
    const suggested = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    setSlug(suggested);
    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    if (fieldErrors.countryCode) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.countryCode;
        return next;
      });
    }
    const country = COUNTRIES.find((c) => c.code === code);
    if (country) {
      setTimezone(country.timezone);
      setCurrencyCode(country.currencyCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const created = await apiFetch<SchoolDto>('/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          countryCode,
          timezone,
          currencyCode,
          defaultLocale,
        }),
      });

      // Redirect directly to the school's workspace subdomain!
      window.location.href = created.url;
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors || {});
      } else if (err instanceof Error) {
        setError(err.message);
        setFieldErrors({});
      } else {
        setError('Failed to create school.');
        setFieldErrors({});
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-sm">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Create New School</h1>
            <p className="text-xs text-slate-500">Step 1 of school onboarding</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <div className="flex items-center gap-2 font-semibold mb-1 text-red-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>Validation Error</span>
            </div>
            {error.includes(';') ? (
              <ul className="list-disc list-inside space-y-1 mt-1.5 pl-1 text-red-700">
                {error.split(';').map((msg, idx) => (
                  <li key={idx} className="font-medium">
                    {msg.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-red-700 font-medium pl-6">{error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              School Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Greenfield International Academy"
              className={`w-full px-3 py-2 text-sm rounded-lg border transition ${
                fieldErrors.name
                  ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500 focus:outline-none'
                  : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subdomain Slug
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  if (fieldErrors.slug) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.slug;
                      return next;
                    });
                  }
                }}
                placeholder="greenfield"
                className={`w-full px-3 py-2 text-sm rounded-l-lg border font-mono text-xs transition ${
                  fieldErrors.slug
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500 focus:outline-none'
                    : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent'
                }`}
              />
              <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-r-lg text-xs font-mono text-slate-500">
                .localhost
              </span>
            </div>
            {fieldErrors.slug ? (
              <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.slug}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">3–40 characters, lowercase letters, digits and single hyphens</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none transition ${
                  fieldErrors.countryCode
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-teal-600'
                }`}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {fieldErrors.countryCode && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.countryCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Currency
              </label>
              <select
                value={currencyCode}
                onChange={(e) => {
                  setCurrencyCode(e.target.value);
                  if (fieldErrors.currencyCode) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.currencyCode;
                      return next;
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none transition ${
                  fieldErrors.currencyCode
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-teal-600'
                }`}
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="PKR">PKR (Rs)</option>
                <option value="NPR">NPR (Rs)</option>
                <option value="LKR">LKR (Rs)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
              {fieldErrors.currencyCode && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.currencyCode}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time Zone
              </label>
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  if (fieldErrors.timezone) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.timezone;
                      return next;
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none transition ${
                  fieldErrors.timezone
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-teal-600'
                }`}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
                <option value="Asia/Kathmandu">Asia/Kathmandu (UTC+5:45)</option>
                <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
                <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="America/Toronto">America/Toronto (UTC-5)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                <option value="Australia/Sydney">Australia/Sydney (UTC+10)</option>
              </select>
              {fieldErrors.timezone && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.timezone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Language
              </label>
              <select
                value={defaultLocale}
                onChange={(e) => {
                  setDefaultLocale(e.target.value as 'en' | 'bn');
                  if (fieldErrors.defaultLocale) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.defaultLocale;
                      return next;
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none transition ${
                  fieldErrors.defaultLocale
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-teal-600'
                }`}
              >
                <option value="en">English (en)</option>
                <option value="bn">বাংলা (bn)</option>
              </select>
              {fieldErrors.defaultLocale && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.defaultLocale}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? 'Creating school...' : 'Create School & Launch Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
