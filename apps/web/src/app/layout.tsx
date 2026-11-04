import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { SessionProvider } from '@/lib/session';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'EduFlow — Modern Multi-Tenant School Management Platform',
  description: 'Enterprise education platform with tenant isolation, role-based access control, and complete school management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
