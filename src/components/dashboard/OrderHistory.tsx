'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatZAR } from '@/lib/formatCurrency';

/**
 * Serialized order shape passed from the Server Component.
 * Dates are serialized as ISO strings across the RSC boundary.
 */
export interface OrderData {
  id: string;
  createdAt: string;
  totalAmountZAR: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

interface OrderHistoryProps {
  orders: OrderData[];
}

const STATUS_STYLES: Record<OrderData['status'], string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-600',
  PAID:    'bg-green-500/20 text-green-600',
  FAILED:  'bg-red-500/20 text-red-600',
  REFUNDED:'bg-blue-500/20 text-blue-600',
};

/**
 * OrderHistory — Client Component that displays the user's order list
 * with clickable rows linking to the order detail page, and polls for
 * status updates every 15 seconds.
 *
 * Requirements: 9.1, 9.2, 9.3
 */
export default function OrderHistory({ orders: initialOrders }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data: OrderData[] = await res.json();
        setOrders(data);
      }
    } catch {
      // Silently fail — keep showing last known data
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 15_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-lg">No orders yet.</p>
        <p className="text-muted/70 text-sm mt-2">
          Your order history will appear here after your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Order History</h2>
      <div className="overflow-x-auto rounded-xl border border-[var(--theme-accent)]/15">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--theme-accent)]/10 bg-[var(--theme-accent)]/5">
              <th className="px-4 py-3 font-medium text-muted">Order</th>
              <th className="px-4 py-3 font-medium text-muted">Date</th>
              <th className="px-4 py-3 font-medium text-muted">Total</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted">Documents</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-[var(--theme-accent)]/10 last:border-0 hover:bg-[var(--theme-accent)]/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-mono text-xs text-[var(--theme-accent)] hover:underline"
                  >
                    {order.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground/80">
                  {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatZAR(order.totalAmountZAR)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.status === 'PAID' && (
                    <div className="flex gap-2">
                      <a href={`/api/documents/invoices/${order.id}`} download
                        className="text-xs text-[var(--theme-accent)] hover:underline">
                        Invoice
                      </a>
                      <a href={`/api/documents/receipts/${order.id}`} download
                        className="text-xs text-[var(--theme-accent)] hover:underline">
                        Receipt
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
