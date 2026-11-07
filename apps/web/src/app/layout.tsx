import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { SessionProvider } from '@/lib/session';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'EduFlow - Complete School Management System',
    template: '%s | EduFlow',
  },
  description:
    'Manage students, teachers, attendance, examinations, results and school operations with EduFlow, your all-in-one school management platform.',
  keywords: [
    'school management system',
    'school ERP',
    'education SaaS',
    'student information system',
    'school administration software',
    'attendance management',
    'examination and results management',
    'multi-tenant school software',
  ],
  authors: [{ name: 'EduFlow' }],
  creator: 'EduFlow',
  openGraph: {
    title: 'EduFlow - Complete School Management System',
    description:
      'Manage students, teachers, attendance, examinations, results and school operations with EduFlow, your all-in-one school management platform.',
    type: 'website',
    locale: 'en_US',
    siteName: 'EduFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduFlow - Complete School Management System',
    description:
      'Manage students, teachers, attendance, examinations, results and school operations with EduFlow, your all-in-one school management platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <SessionProvider>
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
