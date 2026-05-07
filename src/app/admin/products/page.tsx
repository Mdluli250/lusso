import Link from 'next/link';
import { getProducts } from '@/lib/admin/queries';
import { ProductTable } from '@/components/admin/products/ProductTable';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

/**
 * Admin Product Listing page — Server Component.
 * Fetches paginated products with search and sort params.
 *
 * Requirements: 4.1, 4.4, 4.5, 4.6
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const search = params.search ?? '';
  const sortBy = params.sortBy ?? 'createdAt';
  const sortDir = (params.sortDir === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const { products, totalCount } = await getProducts({
    page,
    pageSize: 20,
    search: search || undefined,
    sortBy,
    sortDir,
  });

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <ProductTable
        products={products}
        totalPages={totalPages}
        currentPage={page}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
