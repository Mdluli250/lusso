import { notFound } from 'next/navigation';
import { getDiscountDetail, updateDiscountCode } from '@/actions/admin/discounts';
import { DiscountForm } from '@/components/admin/discounts/DiscountForm';
import type { DiscountFormData } from '@/components/admin/discounts/DiscountForm';

interface EditDiscountPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin Discount Edit page — Server Component.
 * Fetches discount code by ID, renders DiscountForm in edit mode.
 * Calls updateDiscountCode on submit, shows 404 if not found.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default async function EditDiscountPage({ params }: EditDiscountPageProps) {
  const { id } = await params;
  const discount = await getDiscountDetail(id);

  if (!discount) {
    notFound();
  }

  async function handleSubmit(data: DiscountFormData) {
    'use server';
    return updateDiscountCode(id, data);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Edit Discount Code</h1>
      <DiscountForm mode="edit" initialData={discount} onSubmit={handleSubmit} />
    </div>
  );
}
