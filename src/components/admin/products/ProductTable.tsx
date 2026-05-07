'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/admin/ui/DataTable';
import { Pagination } from '@/components/admin/ui/Pagination';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { formatZAR } from '@/lib/formatCurrency';
import { toggleProductActive, deleteProduct } from '@/actions/admin/products';

interface Product {
  id: string;
  name: string;
  price: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  variantCount: number;
  hasOutOfStock: boolean;
  createdAt: Date;
}

interface ProductTableProps {
  products: Product[];
  totalPages: number;
  currentPage: number;
  search: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/**
 * ProductTable — Client Component for displaying and interacting with products.
 * Uses DataTable with sortable columns, SearchInput for filtering,
 * and action buttons for toggle active, edit, and delete.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export function ProductTable({
  products,
  totalPages,
  currentPage,
  search,
  sortBy,
  sortDir,
}: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/admin/products?${params.toString()}`);
  }

  function handleSearch(value: string) {
    updateParams({ search: value, page: '1' });
  }

  function handleSort(key: string) {
    const newDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: key, sortDir: newDir });
  }

  function handlePageChange(page: number) {
    updateParams({ page: String(page) });
  }

  function handleToggleActive(product: Product) {
    startTransition(async () => {
      await toggleProductActive(product.id, !product.isActive);
      router.refresh();
    });
  }

  function handleDelete(product: Product) {
    setDeleteTarget(product);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name as string}</span>
          {(row.hasOutOfStock as boolean) && (
            <StatusBadge status="out-of-stock" />
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (row: Record<string, unknown>) => formatZAR(row.price as number),
    },
    {
      key: 'waxType',
      label: 'Wax Type',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{row.waxType as string}</span>
      ),
    },
    {
      key: 'scentProfile',
      label: 'Scent',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="capitalize">{row.scentProfile as string}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <StatusBadge status={(row.isActive as boolean) ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'variantCount',
      label: 'Variants',
      sortable: true,
      render: (row: Record<string, unknown>) => String(row.variantCount),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        new Date(row.createdAt as string).toLocaleDateString('en-ZA'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleActive(row as unknown as Product)}
            disabled={isPending}
            className="px-2 py-1 text-xs rounded border border-border text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
            aria-label={`${(row.isActive as boolean) ? 'Deactivate' : 'Activate'} ${row.name}`}
          >
            {(row.isActive as boolean) ? 'Deactivate' : 'Activate'}
          </button>
          <Link
            href={`/admin/products/${row.id}/edit`}
            className="px-2 py-1 text-xs rounded border border-border text-foreground hover:bg-surface-muted transition-colors"
            aria-label={`Edit ${row.name}`}
          >
            Edit
          </Link>
          <button
            onClick={() => handleDelete(row as unknown as Product)}
            disabled={isPending}
            className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            aria-label={`Delete ${row.name}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={handleSearch}
        placeholder="Search products…"
      />

      <DataTable
        columns={columns}
        data={products as unknown as Record<string, unknown>[]}
        sortKey={sortBy}
        sortDirection={sortDir}
        onSort={handleSort}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
