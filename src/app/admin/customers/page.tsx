import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import Link from 'next/link';

/**
 * Admin Customers page — Server Component.
 * Lists all users with their order count and total spend.
 */

interface CustomersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const pageSize = 25;
  const search = params.search ?? '';

  let customers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
    _count: { orders: number };
  }[] = [];
  let totalCount = 0;

  try {
    const where = search
      ? { OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]}
      : {};

    [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
  } catch {
    // DB unavailable
  }

  // Fetch total spend per customer for displayed page
  const customerIds = customers.map((c) => c.id);
  const spendMap = new Map<string, number>();
  try {
    const orders = await prisma.order.findMany({
      where: { userId: { in: customerIds }, status: 'PAID' },
      select: { userId: true, totalAmountZAR: true },
    });
    for (const o of orders) {
      spendMap.set(o.userId, (spendMap.get(o.userId) ?? 0) + o.totalAmountZAR);
    }
  } catch { /* ignore */ }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <span className="text-sm text-muted">{totalCount} total</span>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors max-w-xs"
        />
        <button type="submit" className="px-4 py-2 text-sm rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity">
          Search
        </button>
        {search && (
          <a href="/admin/customers" className="px-4 py-2 text-sm rounded-md border border-border text-muted hover:text-foreground transition-colors">
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Role</th>
              <th className="px-4 py-3 text-right font-medium text-muted">Orders</th>
              <th className="px-4 py-3 text-right font-medium text-muted">Total Spent</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {customer.name ?? <span className="text-muted italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{customer.email}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      customer.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-surface-muted text-muted',
                    ].join(' ')}>
                      {customer.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{customer._count.orders}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatZAR(spendMap.get(customer.id) ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(customer.createdAt).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(customer.email)}`}
                      className="text-xs text-theme-accent hover:underline"
                    >
                      View orders
                    </Link>
                  </td>
                </tr>
              ))
            )}
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
            {page > 1 && (
              <a
                href={`/admin/customers?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
              >
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/customers?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
