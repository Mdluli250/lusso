import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById } from '@/lib/admin/queries';
import { formatZAR } from '@/lib/formatCurrency';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Product Detail page — read-only view of a single product.
 * Shows all fields, images, and variants with links to Edit.
 */
export default async function AdminProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const heroImage = product.image ?? product.images?.[0]?.url ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
          </div>
          <p className="text-sm text-muted font-mono">{product.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-foreground transition-colors"
          >
            Preview ↗
          </Link>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity"
          >
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-3">
          {heroImage ? (
            <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface">
              <Image
                src={heroImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-xl border border-border bg-surface flex items-center justify-center text-muted text-sm">
              No image uploaded
            </div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.slice(1).map((img) => (
                <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Price</dt>
              <dd className="font-semibold text-foreground">{formatZAR(product.price)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Burn Time</dt>
              <dd className="text-foreground">{product.burnTimeHours}h</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Wax Type</dt>
              <dd className="text-foreground capitalize">{product.waxType}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Scent Profile</dt>
              <dd className="text-foreground capitalize">{product.scentProfile}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Created</dt>
              <dd className="text-foreground">
                {new Date(product.createdAt).toLocaleDateString('en-ZA')}
              </dd>
            </div>
          </dl>

          {/* Description */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Variants ({product.variants.length})
        </h2>
        {product.variants.length === 0 ? (
          <p className="text-sm text-muted">No variants.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Scent</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Wax</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted">Color</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted">Stock</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-foreground capitalize">{v.scent}</td>
                    <td className="px-4 py-2.5 text-foreground capitalize">{v.waxType}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        <span className="text-muted text-xs">{v.colorHex}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusBadge
                        status={v.stock === 0 ? 'out-of-stock' : v.stock <= 5 ? 'low-stock' : 'in-stock'}
                      />
                      <span className="ml-2 text-foreground">{v.stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
