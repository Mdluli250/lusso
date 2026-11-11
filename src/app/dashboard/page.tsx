import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import OrderHistory from '@/components/dashboard/OrderHistory';
import type { OrderData } from '@/components/dashboard/OrderHistory';

/**
 * Dashboard page — Server Component that fetches the user's orders
 * sorted by createdAt descending and renders OrderHistory with initial data.
 *
 * Requirements: 9.1, 9.2, 9.4
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let serializedOrders: OrderData[] = [];
  let totalSpent = 0;
  let paidOrderCount = 0;

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        totalAmountZAR: true,
        status: true,
        fulfillmentStatus: true,
        carrier: true,
        trackingNumber: true,
        refundAmountZAR: true,
      },
    });

    serializedOrders = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      totalAmountZAR: order.totalAmountZAR,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      refundAmountZAR: order.refundAmountZAR,
    }));

    paidOrderCount = orders.filter((o) => o.status === 'PAID').length;
    totalSpent = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + o.totalAmountZAR, 0);
  } catch {
    // Database unavailable — show empty state
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* User greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[var(--border)]">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome back{session.user.name ? `, ${session.user.name}` : ''}
            </h1>
            <p className="text-muted text-sm mt-1">{session.user.email}</p>
          </div>
          <a
            href="/collection"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] text-cream text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            Shop Now
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>

        {/* Spending summary cards */}
        {paidOrderCount > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-5 py-5 col-span-1">
              <p className="text-xs text-muted font-semibold uppercase tracking-widest mb-2">Total Spent</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{formatZAR(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-5 py-5 col-span-1">
              <p className="text-xs text-muted font-semibold uppercase tracking-widest mb-2">Orders Placed</p>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">{paidOrderCount}</p>
            </div>
          </div>
        )}

        {/* Order history */}
        <OrderHistory orders={serializedOrders} />
      </div>
    </div>
  );
}
