import { DiscountForm } from '@/components/admin/discounts/DiscountForm';
import { createDiscountCode } from '@/actions/admin/discounts';
import type { DiscountFormData } from '@/components/admin/discounts/DiscountForm';

/**
 * Admin Discount Creation page — Server Component.
 * Renders DiscountForm in create mode, calls createDiscountCode on submit.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default function NewDiscountPage() {
  async function handleSubmit(data: DiscountFormData) {
    'use server';
    return createDiscountCode(data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Create Discount Code</h1>
      <DiscountForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
