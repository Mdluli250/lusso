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
      },
    });

    serializedOrders = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      totalAmountZAR: order.totalAmountZAR,
      status: order.status,
    }));

    paidOrderCount = orders.filter((o) => o.status === 'PAID').length;
    totalSpent = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + o.totalAmountZAR, 0);
  } catch {
    // Database unavailable — show empty state
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* User greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back{session.user.name ? `, ${session.user.name}` : ''}
            </h1>
            <p className="text-muted text-sm mt-1">{session.user.email}</p>
          </div>
        </div>

        {/* Spending summary cards */}
        {paidOrderCount > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-5 py-4">
              <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">{formatZAR(totalSpent)}</p>
            </div>
            <div className="rounded-xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-5 py-4">
              <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1">Orders Placed</p>
              <p className="text-2xl font-bold text-foreground">{paidOrderCount}</p>
            </div>
          </div>
        )}

        {/* Order history */}
        <OrderHistory orders={serializedOrders} />
      </div>
    </div>
  );
}
