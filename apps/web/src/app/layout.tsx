import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { SessionProvider } from '@/lib/session';
import { Navbar } from '@/components/Navbar';

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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <SessionProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
              <p>EduFlow SaaS Platform &copy; {new Date().getFullYear()}. Enterprise Grade Multi-Tenant School Infrastructure.</p>
            </footer>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
