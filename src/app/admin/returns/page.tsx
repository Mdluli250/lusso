import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import { ReturnStatusForm } from './ReturnStatusForm';

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-500/15 text-yellow-400',
  APPROVED:  'bg-blue-500/15 text-blue-400',
  REJECTED:  'bg-red-500/15 text-red-400',
  COMPLETED: 'bg-green-500/15 text-green-400',
};

export default async function AdminReturnsPage() {
  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  // Enrich with order + user info
  const enriched = await Promise.all(
    returns.map(async (r) => {
      const order = await prisma.order.findUnique({
        where: { id: r.orderId },
        include: { user: { select: { name: true, email: true } } },
      }).catch(() => null);
      return { ...r, order };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Return Requests</h1>

      {enriched.length === 0 ? (
        <p className="text-muted text-sm">No return requests yet.</p>
      ) : (
        <div className="space-y-4">
          {enriched.map((r) => {
            const retItems = Array.isArray(r.items)
              ? (r.items as { name: string; quantity: number }[])
              : [];

            return (
              <div key={r.id} className="rounded-lg border border-border bg-surface p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-foreground font-mono">{r.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted mt-0.5">
                      Order: <a href={`/admin/orders/${r.orderId}`} className="underline hover:no-underline">{r.orderId.slice(0, 8)}</a>
                      {r.order && ` · ${r.order.user.name ?? r.order.user.email}`}
                      {r.order && ` · ${formatZAR(r.order.totalAmountZAR)}`}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted mb-1">Items</p>
                  <ul className="text-sm text-foreground space-y-0.5">
                    {retItems.map((item, i) => (
                      <li key={i}>{item.name} × {item.quantity}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted mb-1">Customer reason</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{r.reason}</p>
                </div>

                {r.adminNote && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-1">Admin note</p>
                    <p className="text-sm text-foreground">{r.adminNote}</p>
                  </div>
                )}

                <ReturnStatusForm returnId={r.id} currentStatus={r.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
