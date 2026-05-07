import { getInventory } from '@/lib/admin/queries';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';

interface InventoryPageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

/**
 * Admin Inventory page — Server Component.
 * Fetches all product variants with stock levels and displays summary badges
 * and a filterable inventory table.
 *
 * Requirements: 9.1, 9.4, 9.5, 9.6
 */
export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const filter = (params.filter as 'all' | 'out-of-stock' | 'low-stock') ?? 'all';

  const { variants, outOfStockCount, lowStockCount } = await getInventory({ filter });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Inventory</h1>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/15">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm font-medium text-red-400">
            {outOfStockCount} out of stock
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/15">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            {lowStockCount} low stock
          </span>
        </div>
      </div>

      <InventoryTable variants={variants} currentFilter={filter} />
    </div>
  );
}
