'use client';

import { useCallback, useEffect, useState } from 'react';
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
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  PAID: 'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-300',
  REFUNDED: 'bg-blue-500/20 text-blue-300',
};

/**
 * OrderHistory — Client Component that displays the user's order list
 * and polls for status updates every 15 seconds to reflect webhook-driven
 * changes within 30 seconds.
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
      // Silently fail on poll errors — keep showing last known data
    }
  }, []);

  // Poll every 15 seconds for status updates (Requirement 9.3)
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-muted text-muted">
              <th className="py-3 pr-4 font-medium">Order ID</th>
              <th className="py-3 pr-4 font-medium">Date</th>
              <th className="py-3 pr-4 font-medium">Total</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 font-medium">Documents</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-surface-muted/50 hover:bg-surface-muted/30 transition-colors"
              >
                <td className="py-3 pr-4 font-mono text-xs text-foreground/80">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="py-3 pr-4 text-foreground/80">
                  {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 pr-4 text-foreground">
                  {formatZAR(order.totalAmountZAR)}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-3">
                  {order.status === 'PAID' && (
                    <div className="flex gap-2">
                      <a
                        href={`/api/documents/invoices/${order.id}`}
                        download
                        className="text-xs text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
                      >
                        Download Invoice
                      </a>
                      <a
                        href={`/api/documents/receipts/${order.id}`}
                        download
                        className="text-xs text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
                      >
                        Download Receipt
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
