import { ProductForm } from '@/components/admin/products/ProductForm';

/**
 * Admin Product Creation page — Server Component.
 * Renders ProductForm in create mode (no initial data).
 *
 * Requirements: 5.1, 5.2
 */
export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
