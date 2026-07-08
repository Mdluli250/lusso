'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/admin/ui/DataTable';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { toggleDiscountActive } from '@/actions/admin/discounts';
import { getDiscountStatus } from '@/lib/discounts/getDiscountStatus';

interface DiscountRow {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  maxUsageCount: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  stackable: boolean;
  minOrderAmountZAR: number;
  totalDiscountGiven: number;
}

interface DiscountTableProps {
  discounts: DiscountRow[];
  search: string;
}

/**
 * DiscountTable — Client Component for displaying and interacting with discount codes.
 * Provides search filtering, status badges, and activate/deactivate/edit actions.
 *
 * Requirements: 8.1, 8.2, 8.4, 8.6, 10.1, 10.2, 10.5
 */
export function DiscountTable({ discounts, search }: DiscountTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`/admin/discounts?${params.toString()}`);
  }

  function handleToggleActive(row: DiscountRow) {
    startTransition(async () => {
      await toggleDiscountActive(row.id, !row.active);
      router.refresh();
    });
  }

  function formatDiscountValue(type: string, value: number): string {
    switch (type) {
      case 'PERCENTAGE':
        return `${value}%`;
      case 'FIXED_AMOUNT':
        return `R ${(value / 100).toFixed(2)}`;
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      default:
        return String(value);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-ZA');
  }

  function formatUsage(usageCount: number, maxUsageCount: number | null): string {
    if (maxUsageCount === null) return `${usageCount} / ∞`;
    return `${usageCount} / ${maxUsageCount}`;
  }

  function formatRevenueImpact(amountCents: number): string {
    return `R ${(amountCents / 100).toFixed(2)}`;
  }

  function renderStatusBadge(row: DiscountRow) {
    const status = getDiscountStatus({
      active: row.active,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      maxUsageCount: row.maxUsageCount,
      usageCount: row.usageCount,
    });

    const isValid = status === 'valid';
    const classes = isValid
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}
      >
        {isValid ? 'Valid' : 'Invalid'}
      </span>
    );
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-medium">{row.code as string}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: Record<string, unknown>) => (
        <span className="capitalize text-xs">
          {(row.type as string).replace('_', ' ').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (row: Record<string, unknown>) =>
        formatDiscountValue(row.type as string, row.value as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => renderStatusBadge(row as unknown as DiscountRow),
    },
    {
      key: 'usageCount',
      label: 'Usage',
      render: (row: Record<string, unknown>) =>
        formatUsage(row.usageCount as number, row.maxUsageCount as number | null),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (row: Record<string, unknown>) => formatDate(row.startDate as string | null),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (row: Record<string, unknown>) => formatDate(row.endDate as string | null),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row: Record<string, unknown>) => formatDate(row.createdAt as string | null),
    },
    {
      key: 'totalDiscountGiven',
      label: 'Revenue Impact',
      render: (row: Record<string, unknown>) =>
        formatRevenueImpact(row.totalDiscountGiven as number),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/discounts/${row.id}/edit`}
            className="px-2 py-1 text-xs rounded border border-border text-foreground hover:bg-surface-muted transition-colors"
            aria-label={`Edit ${row.code}`}
          >
            Edit
          </Link>
          <button
            onClick={() => handleToggleActive(row as unknown as DiscountRow)}
            disabled={isPending}
            className="px-2 py-1 text-xs rounded border border-border text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
            aria-label={`${(row.active as boolean) ? 'Deactivate' : 'Activate'} ${row.code}`}
          >
            {(row.active as boolean) ? 'Deactivate' : 'Activate'}
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
        placeholder="Search discount codes…"
      />

      <DataTable
        columns={columns}
        data={discounts as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}
