import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

/**
 * Dashboard Subscriptions page — Server Component.
 * Displays all user subscriptions with management controls.
 */
export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        include: {
          product: {
            select: { name: true, slug: true, price: true, scentProfile: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = subscriptions.map((sub) => ({
    id: sub.id,
    frequency: sub.frequency,
    status: sub.status,
    nextDeliveryAt: sub.nextDeliveryAt?.toISOString() ?? null,
    failureReason: sub.failureReason,
    createdAt: sub.createdAt.toISOString(),
    variant: {
      id: sub.variant.id,
      scent: sub.variant.scent,
      product: sub.variant.product,
    },
  }));

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-foreground">My Subscriptions</h1>

        {serialized.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">You don&apos;t have any subscriptions yet.</p>
            <a
              href="/collection"
              className="inline-block mt-4 text-sm text-[var(--theme-accent)] hover:underline"
            >
              Browse our collection to subscribe
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {serialized.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
