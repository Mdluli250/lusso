import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AccountSettingsForm from '@/components/dashboard/AccountSettingsForm';

/**
 * Dashboard Settings page — Server Component that fetches the session user
 * and renders AccountSettingsForm.
 *
 * Requirements: 9.4
 */
export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <AccountSettingsForm
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      </div>
    </main>
  );
}
