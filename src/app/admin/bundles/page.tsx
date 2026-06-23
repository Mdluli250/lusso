import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import Link from 'next/link';

/**
 * Admin Bundles page — shows all active products grouped for bundle creation.
 * Admins can see current bundle deals and apply discounts.
 */
export default async function AdminBundlesPage() {
  let products: { id: string; name: string; slug: string; price: number; scentProfile: string; isActive: boolean }[] = [];

  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, price: true, scentProfile: true, isActive: true },
      orderBy: { name: 'asc' },
    });
  } catch { /* DB unavailable */ }

  const bundlePrice = (p1: number, p2: number, p3: number) => {
    const total = p1 + p2 + p3;
    return Math.round(total * 0.85); // 15% off
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bundle Management</h1>
          <p className="text-sm text-muted mt-1">
            Customers can build any 3-candle bundle and save 15%. Manage which products are available for bundling.
          </p>
        </div>
        <Link
          href="/bundle"
          target="_blank"
          className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-foreground transition-colors"
        >
          Preview Bundle Page ↗
        </Link>
      </div>

      {/* Bundle deal info */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Current Bundle Offer</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-green-500 font-bold text-lg">15%</span>
            <span className="text-sm text-green-600">discount on any 3 candles</span>
          </div>
          <p className="text-sm text-muted">
            Any 3 active products can be bundled. The discount is applied automatically at checkout.
          </p>
        </div>
      </div>

      {/* Example bundle calculator */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Active Products Available for Bundling ({products.length})
        </h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted">No active products. Add products first.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Product</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Scent</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted">Price</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted">Bundle Price (15% off)</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-2.5 text-muted capitalize">{p.scentProfile}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{formatZAR(p.price)}</td>
                    <td className="px-4 py-2.5 text-right text-green-500 font-medium">
                      {formatZAR(Math.round(p.price * 0.85))}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-xs text-theme-accent hover:underline"
                      >
                        Edit product
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Example bundle pricing */}
      {products.length >= 3 && (
        <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Example Bundle Pricing</h2>
          <p className="text-xs text-muted">First 3 products as an example</p>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {products.slice(0, 3).map((p, i) => (
              <span key={p.id} className="text-foreground">
                {p.name} ({formatZAR(p.price)}){i < 2 ? ' +' : ''}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-border text-sm">
            <span className="text-muted">
              Subtotal: {formatZAR(products[0].price + products[1].price + products[2].price)}
            </span>
            <span className="text-green-500 font-medium">
              Bundle total: {formatZAR(bundlePrice(products[0].price, products[1].price, products[2].price))}
            </span>
            <span className="text-green-500">
              Saving: {formatZAR(products[0].price + products[1].price + products[2].price - bundlePrice(products[0].price, products[1].price, products[2].price))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
