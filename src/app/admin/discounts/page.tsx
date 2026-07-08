import Link from 'next/link';
import { getDiscountCodes } from '@/actions/admin/discounts';
import { DiscountTable } from '@/components/admin/discounts/DiscountTable';

interface DiscountsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

/**
 * Admin Discount Listing page — Server Component.
 * Fetches all discount codes with stats and renders a searchable table.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2, 10.4, 10.5
 */
export default async function DiscountsPage({ searchParams }: DiscountsPageProps) {
  const params = await searchParams;
  const search = params.search ?? '';

  const discounts = await getDiscountCodes(search || undefined);

  // Serialize dates to strings for client component
  const serializedDiscounts = discounts.map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: d.value,
    active: d.active,
    maxUsageCount: d.maxUsageCount,
    usageCount: d.usageCount,
    startDate: d.startDate ? d.startDate.toISOString() : null,
    endDate: d.endDate ? d.endDate.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    stackable: d.stackable,
    minOrderAmountZAR: d.minOrderAmountZAR,
    totalDiscountGiven: d.totalDiscountGiven,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Discount Codes</h1>
        <Link
          href="/admin/discounts/new"
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors"
        >
          + Create Discount
        </Link>
      </div>

      <DiscountTable discounts={serializedDiscounts} search={search} />
    </div>
  );
}
