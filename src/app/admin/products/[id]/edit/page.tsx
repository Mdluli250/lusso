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
      <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
      <ProductForm mode="edit" initialData={product} />
    </div>
  );
}
