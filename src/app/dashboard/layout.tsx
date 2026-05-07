import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth-guard layout for all /dashboard routes.
 * Unauthenticated users are redirected to the sign-in page (Requirement 2.3, 9.6).
 * Provides consistent sub-navigation across all dashboard pages.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <DashboardNav />
      {children}
    </div>
  );
}
