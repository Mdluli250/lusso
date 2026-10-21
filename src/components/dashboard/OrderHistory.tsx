'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatZAR } from '@/lib/formatCurrency';

export interface OrderData {
  id: string;
  createdAt: string;
  totalAmountZAR: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  fulfillmentStatus?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  refundAmountZAR?: number;
}

interface OrderHistoryProps {
  orders: OrderData[];
}

const STATUS_STYLES: Record<OrderData['status'], string> = {
  PENDING:  'bg-yellow-500/20 text-yellow-600',
  PAID:     'bg-green-500/20 text-green-600',
  FAILED:   'bg-red-500/20 text-red-600',
  REFUNDED: 'bg-blue-500/20 text-blue-600',
};

const FULFILLMENT_STYLES: Record<string, string> = {
  UNFULFILLED: 'text-[var(--theme-accent)]/50',
  PROCESSING:  'text-blue-400',
  SHIPPED:     'text-purple-400',
  DELIVERED:   'text-green-400',
  CANCELLED:   'text-red-400',
};

const PAGE_SIZE = 10;

export default function OrderHistory({ orders: initialOrders }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data: OrderData[] = await res.json();
        setOrders(data);
      }
    } catch {
      // Keep showing last known data
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

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Order History</h2>
        <span className="text-sm text-muted">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--theme-accent)]/15">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--theme-accent)]/10 bg-[var(--theme-accent)]/5">
              <th className="px-4 py-3 font-medium text-muted">Order</th>
              <th className="px-4 py-3 font-medium text-muted">Date</th>
              <th className="px-4 py-3 font-medium text-muted">Total</th>
              <th className="px-4 py-3 font-medium text-muted">Payment</th>
              <th className="px-4 py-3 font-medium text-muted">Delivery</th>
              <th className="px-4 py-3 font-medium text-muted">Documents</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((order) => {
              const fulfillment = order.fulfillmentStatus ?? 'UNFULFILLED';
              return (
                <tr
                  key={order.id}
                  className="border-b border-[var(--theme-accent)]/10 last:border-0 hover:bg-[var(--theme-accent)]/5 transition-colors"
                >
                  {/* Order ID */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-mono text-xs text-[var(--theme-accent)] hover:underline"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {formatZAR(order.totalAmountZAR)}
                    {(order.refundAmountZAR ?? 0) > 0 && (
                      <div className="text-xs text-blue-400 font-normal">
                        −{formatZAR(order.refundAmountZAR ?? 0)} refunded
                      </div>
                    )}
                  </td>

                  {/* Payment status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* Fulfillment / tracking */}
                  <td className="px-4 py-3 text-xs">
                    <span className={FULFILLMENT_STYLES[fulfillment] ?? 'text-muted'}>
                      {fulfillment}
                    </span>
                    {order.trackingNumber && (
                      <div className="text-[var(--theme-accent)]/50 mt-0.5">
                        {order.carrier ? `${order.carrier}: ` : ''}{order.trackingNumber}
                      </div>
                    )}
                  </td>

                  {/* Documents */}
                  <td className="px-4 py-3">
                    {order.status === 'PAID' && (
                      <div className="flex gap-2">
                        <a
                          href={`/api/documents/invoices/${order.id}`}
                          className="text-xs text-[var(--theme-accent)] hover:underline"
                        >
                          Invoice
                        </a>
                        <a
                          href={`/api/documents/receipts/${order.id}`}
                          className="text-xs text-[var(--theme-accent)] hover:underline"
                        >
                          Receipt
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] disabled:opacity-30 hover:bg-[var(--theme-accent)]/5 transition-colors"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-md border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] disabled:opacity-30 hover:bg-[var(--theme-accent)]/5 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
