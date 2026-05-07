import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * RoleGuard layout for all /admin routes.
 * - Unauthenticated users are redirected to the sign-in page (Requirement 1.4).
 * - Users with role CUSTOMER are redirected to the home page (Requirement 1.2).
 * - Users with role ADMIN are granted access (Requirement 1.3).
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user.role === 'CUSTOMER') {
    redirect('/');
  }

  return (
    <AdminShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }}
    >
      {children}
    </AdminShell>
  );
}
