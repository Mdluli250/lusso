import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import { CancelOrderButton } from '@/components/dashboard/CancelOrderButton';
import { ReturnRequestForm } from '@/components/dashboard/ReturnRequestForm';
import { DocumentDownloadButton } from '@/components/dashboard/DocumentDownloadButton';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-500/20 text-yellow-600',
  PAID:     'bg-green-500/20 text-green-600',
  FAILED:   'bg-red-500/20 text-red-600',
  REFUNDED: 'bg-blue-500/20 text-blue-600',
};

const FULFILLMENT_STYLES: Record<string, string> = {
  UNFULFILLED: 'bg-yellow-500/15 text-yellow-500',
  PROCESSING:  'bg-blue-500/15 text-blue-400',
  SHIPPED:     'bg-purple-500/15 text-purple-400',
  DELIVERED:   'bg-green-500/15 text-green-500',
  CANCELLED:   'bg-red-500/15 text-red-400',
};

export default async function DashboardOrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
  }).catch(() => null);

  if (!order) notFound();

  const items = Array.isArray(order.items)
    ? (order.items as { name: string; quantity: number; price: number }[])
    : [];

  const shippingAddress = order.shippingAddress as Record<string, string> | null;

  // Check for existing return request
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { orderId: id },
    select: { id: true, status: true, createdAt: true },
  }).catch(() => null);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] transition-colors"
        >
          ← Back to orders
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Order <span className="font-mono">{order.id.slice(0, 8)}…</span>
            </h1>
            <p className="text-muted text-sm mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] ?? ''}`}>
              {order.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${FULFILLMENT_STYLES[order.fulfillmentStatus] ?? ''}`}>
              {order.fulfillmentStatus}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        {shippingAddress && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Delivery Address</h2>
            <address className="not-italic text-sm text-muted">
              <p>{shippingAddress.recipient}</p>
              <p>{shippingAddress.phone}</p>
              <p>{shippingAddress.addressLine1}{shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}</p>
              <p>{shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}</p>
              <p>{shippingAddress.country}</p>
            </address>
          </div>
        )}

        {/* Tracking */}
        {order.trackingNumber && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Tracking</h2>
            <p className="text-sm text-muted">
              {order.carrier && <span className="font-medium text-foreground">{order.carrier} — </span>}
              <span className="font-mono">{order.trackingNumber}</span>
            </p>
          </div>
        )}

        {/* Items */}
        <div className="rounded-xl border border-[var(--theme-accent)]/15 overflow-hidden">
          <div className="px-5 py-3 bg-[var(--theme-accent)]/5 border-b border-[var(--theme-accent)]/10">
            <h2 className="text-sm font-semibold text-foreground">Items</h2>
          </div>
          {items.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">No items recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--theme-accent)]/10">
                  <th className="px-5 py-3 text-left font-medium text-muted">Product</th>
                  <th className="px-5 py-3 text-right font-medium text-muted">Qty</th>
                  <th className="px-5 py-3 text-right font-medium text-muted">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-[var(--theme-accent)]/10 last:border-0">
                    <td className="px-5 py-3 text-foreground">{item.name}</td>
                    <td className="px-5 py-3 text-right text-foreground">{item.quantity}</td>
                    <td className="px-5 py-3 text-right text-foreground">{formatZAR(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {order.shippingAmountZAR > 0 && (
            <div className="px-5 py-2 border-t border-[var(--theme-accent)]/10 flex justify-between text-sm text-muted">
              <span>Shipping</span>
              <span>{formatZAR(order.shippingAmountZAR)}</span>
            </div>
          )}
          <div className="px-5 py-3 border-t border-[var(--theme-accent)]/10 flex justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">{formatZAR(order.totalAmountZAR)}</span>
          </div>
        </div>

        {/* Gift wrap */}
        {order.giftWrap && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">🎁 Gift Wrapped</h2>
            {order.giftMessage && (
              <p className="text-sm text-muted italic">"{order.giftMessage}"</p>
            )}
          </div>
        )}

        {/* Documents */}
        {order.status === 'PAID' && (
          <div className="flex gap-3 flex-wrap">
            <DocumentDownloadButton orderId={order.id} type="invoice" />
            <DocumentDownloadButton orderId={order.id} type="receipt" />
          </div>
        )}

        {/* Cancel — only for PENDING orders */}
        {order.status === 'PENDING' && (
          <div className="rounded-xl border border-red-900/20 px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Cancel order</h2>
            <p className="text-sm text-muted">This order is awaiting payment. You can cancel it now.</p>
            <CancelOrderButton orderId={order.id} />
          </div>
        )}

        {/* Return request — for PAID + DELIVERED orders */}
        {order.status === 'PAID' && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Returns &amp; refunds</h2>
            {existingReturn ? (
              <p className="text-sm text-muted">
                Return request submitted on {new Date(existingReturn.createdAt).toLocaleDateString('en-ZA')}.{' '}
                Status: <span className="font-medium text-[var(--theme-accent)]">{existingReturn.status}</span>
              </p>
            ) : (
              <ReturnRequestForm orderId={order.id} items={items} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
