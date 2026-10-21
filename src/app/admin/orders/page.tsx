import { getOrders } from '@/lib/admin/queries';
import { OrderTable } from '@/components/admin/orders/OrderTable';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

/**
 * Admin Order Listing page — Server Component.
 * Fetches paginated orders with status filter and search params.
 *
 * Requirements: 7.1, 7.4
 */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const status = params.status ?? '';
  const search = params.search ?? '';

  const { orders, totalCount } = await getOrders({
    page,
    pageSize: 25,
    status: status || undefined,
    search: search || undefined,
  });

  const totalPages = Math.ceil(totalCount / 25);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <a
          href="/api/admin/export/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
        >
          ↓ Export CSV
        </a>
      </div>

      <OrderTable
        orders={orders}
        totalPages={totalPages}
        currentPage={page}
        status={status}
        search={search}
      />
    </div>
  );
}
