import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/admin/queries';
import { ProductForm } from '@/components/admin/products/ProductForm';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Product Edit page — Server Component.
 * Fetches product by ID and renders ProductForm in edit mode.
 * Shows 404 if product not found.
 *
 * Requirements: 5.3
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        <a
          href={`/products/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Preview on site ↗
        </a>
      </div>
      <ProductForm mode="edit" initialData={product} />
    </div>
  );
}
