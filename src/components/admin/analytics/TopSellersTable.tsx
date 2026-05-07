import { formatZAR } from '@/lib/formatCurrency';

interface TopSellersTableProps {
  products: { name: string; totalSold: number; revenue: number }[];
}

/**
 * TopSellersTable — table of top 5 products with name, quantity sold,
 * and revenue (formatted in ZAR). Revenue values are in cents.
 *
 * Requirements: 3.4
 */
export function TopSellersTable({ products }: TopSellersTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted mb-4">Top Sellers</h3>
      {products.length === 0 ? (
        <p className="text-sm text-muted">No sales data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted">#</th>
                <th className="text-left py-2 pr-4 font-medium text-muted">Product</th>
                <th className="text-right py-2 pr-4 font-medium text-muted">Qty Sold</th>
                <th className="text-right py-2 font-medium text-muted">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4 text-muted">{index + 1}</td>
                  <td className="py-2.5 pr-4 text-foreground font-medium truncate max-w-[200px]">
                    {product.name}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-foreground">
                    {product.totalSold}
                  </td>
                  <td className="py-2.5 text-right text-foreground">
                    {formatZAR(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
