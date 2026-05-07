import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/admin/queries';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { StatusTransition } from '@/components/admin/orders/StatusTransition';
import { formatZAR } from '@/lib/formatCurrency';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Order Detail page — Server Component.
 * Displays full order information with status transition controls.
 *
 * Requirements: 8.1
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Order <span className="font-mono">{order.id.slice(0, 8)}</span>
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Order ID</dt>
              <dd className="font-mono text-foreground">{order.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Transaction ID</dt>
              <dd className="font-mono text-foreground">{order.merchantTransactionId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Status</dt>
              <dd><StatusBadge status={order.status} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Payment Status</dt>
              <dd className="text-foreground">{order.paymentStatus ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Total</dt>
              <dd className="font-medium text-foreground">{formatZAR(order.totalAmountZAR)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Created</dt>
              <dd className="text-foreground">
                {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Customer Details */}
        <div className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Customer</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd className="text-foreground">{order.customerName ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd className="text-foreground">{order.customerEmail}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Status Transition */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Update Status</h2>
        <StatusTransition orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Gift Wrapping */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Gift Wrapping</h2>
        {order.giftWrap ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-500">🎁 Gift wrapped</span>
              <span className="text-xs text-muted">(+ R49.00)</span>
            </div>
            {order.giftMessage && (
              <div className="bg-surface-muted rounded-md p-3">
                <p className="text-xs text-muted mb-1">Gift Message:</p>
                <p className="text-sm text-foreground italic">&ldquo;{order.giftMessage}&rdquo;</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">No gift wrapping</p>
        )}
      </div>

      {/* Invoice Download (for PAID orders) */}
      {order.status === 'PAID' && (
        <div className="rounded-lg border border-border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Documents</h2>
          <a
            href={`/api/documents/invoices/${order.id}`}
            download
            className="inline-block px-4 py-2 text-sm font-medium text-foreground bg-surface-muted hover:bg-surface-muted/80 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
          >
            Download Invoice
          </a>
        </div>
      )}

      {/* Order Items */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Items</h2>
        {order.items.length === 0 ? (
          <p className="text-sm text-muted">No items recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted">Item</th>
                  <th className="px-4 py-2 text-right font-medium text-muted">Qty</th>
                  <th className="px-4 py-2 text-right font-medium text-muted">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-foreground">{item.name}</td>
                    <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {formatZAR(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
