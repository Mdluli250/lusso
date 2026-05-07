'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/ui/DataTable';
import { Pagination } from '@/components/admin/ui/Pagination';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { formatZAR } from '@/lib/formatCurrency';

interface Order {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentStatus: string | null;
  totalAmountZAR: number;
  createdAt: Date;
}

interface OrderTableProps {
  orders: Order[];
  totalPages: number;
  currentPage: number;
  status: string;
  search: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

/**
 * OrderTable — Client Component for displaying and filtering orders.
 * Uses DataTable with status filter dropdown, search input, and clickable rows.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
export function OrderTable({
  orders,
  totalPages,
  currentPage,
  status,
  search,
}: OrderTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/admin/orders?${params.toString()}`);
  }

  function handleSearch(value: string) {
    updateParams({ search: value, page: '1' });
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ status: e.target.value, page: '1' });
  }

  function handlePageChange(page: number) {
    updateParams({ page: String(page) });
  }

  function handleRowClick(row: Record<string, unknown>) {
    router.push(`/admin/orders/${row.id}`);
  }

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-xs">
          {(row.id as string).slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (row: Record<string, unknown>) =>
        (row.customerName as string | null) ?? '—',
    },
    {
      key: 'customerEmail',
      label: 'Email',
      render: (row: Record<string, unknown>) => (
        <span className="text-muted">{row.customerEmail as string}</span>
      ),
    },
    {
      key: 'totalAmountZAR',
      label: 'Total',
      render: (row: Record<string, unknown>) =>
        formatZAR(row.totalAmountZAR as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => (
        <StatusBadge status={row.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'} />
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row: Record<string, unknown>) =>
        (row.paymentStatus as string | null) ?? '—',
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row: Record<string, unknown>) =>
        new Date(row.createdAt as string).toLocaleDateString('en-ZA'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by transaction ID or email…"
          />
        </div>
        <select
          value={status}
          onChange={handleStatusChange}
          className="px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground transition-colors focus:border-theme-accent"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders as unknown as Record<string, unknown>[]}
        onRowClick={handleRowClick}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
