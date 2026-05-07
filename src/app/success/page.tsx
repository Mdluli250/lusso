/**
 * Success Page — Server Component
 *
 * Reads `merchantTransactionId` from search params, fetches the matching Order
 * from the database, and renders the celebration UI with order summary.
 *
 * If the merchantTransactionId is missing or doesn't match any order,
 * displays an "Order not found" message with a link to the Dashboard.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import { SuccessClient } from './SuccessClient';

interface SuccessPageProps {
  searchParams: Promise<{ merchantTransactionId?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const merchantTransactionId = params.merchantTransactionId;

  // If merchantTransactionId is missing, show "Order not found" (Requirement 10.5)
  if (!merchantTransactionId) {
    return <OrderNotFound />;
  }

  // Fetch the order from the database (Requirement 10.1)
  const order = await prisma.order.findUnique({
    where: { merchantTransactionId },
  });

  // If no matching order, show "Order not found" (Requirement 10.5)
  if (!order) {
    return <OrderNotFound />;
  }

  // Parse items from the JSON field
  const items = (order.items as Array<{ name: string; scent: string; quantity: number; price: number }>) ?? [];

  return (
    <SuccessClient
      orderId={order.id}
      totalAmountZAR={formatZAR(order.totalAmountZAR)}
      items={items}
      status={order.status}
    />
  );
}

/**
 * "Order not found" fallback UI with a link to the Dashboard.
 * Requirement 10.5
 */
function OrderNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-[var(--theme-accent)] mb-4">
        Order not found
      </h1>
      <p className="text-[var(--theme-accent)]/70 mb-6">
        We couldn&apos;t find an order matching your request.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
