'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/admin/slugify';
import { validateProductForm } from '@/lib/admin/validateProduct';
import { createProduct, updateProduct } from '@/actions/admin/products';

interface VariantData {
  id?: string;
  scent: string;
  waxType: string;
  colorHex: string;
  modelPath: string;
  stock: number;
  _delete?: boolean;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  burnTimeHours: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  variants: {
    id: string;
    scent: string;
    waxType: string;
    colorHex: string;
    modelPath: string;
    stock: number;
  }[];
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: ProductData;
}

const WAX_TYPE_OPTIONS = ['soy', 'beeswax', 'coconut'];
const SCENT_PROFILE_OPTIONS = ['lavender', 'cinnamon', 'vanilla', 'eucalyptus'];

/**
 * ProductForm — Client Component for creating and editing products.
 * Includes inline variant management, client-side validation,
 * and loading state on submit.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.6
 */
export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [price, setPrice] = useState(
    initialData ? String(initialData.price / 100) : ''
  );
  const [burnTimeHours, setBurnTimeHours] = useState(
    initialData ? String(initialData.burnTimeHours) : ''
  );
  const [waxType, setWaxType] = useState(initialData?.waxType ?? '');
  const [scentProfile, setScentProfile] = useState(initialData?.scentProfile ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Variants state
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants.map((v) => ({ ...v })) ?? []
  );

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
  }

  function addVariant() {
    setVariants([
      ...variants,
      { scent: '', waxType: 'soy', colorHex: '#d4a574', modelPath: '', stock: 0 },
    ]);
  }

  function updateVariant(index: number, field: keyof VariantData, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const variant = prev[index];
      if (variant.id) {
        // Mark existing variant for deletion
        return prev.map((v, i) => (i === index ? { ...v, _delete: true } : v));
      }
      // Remove new variant entirely
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    const priceInCents = Math.round(parseFloat(price || '0') * 100);
    const burnTime = parseFloat(burnTimeHours || '0');

    // Validate
    const validationErrors = validateProductForm({
      name,
      slug,
      description,
      price: priceInCents,
      burnTimeHours: burnTime,
      waxType,
      scentProfile,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const formData = {
      name,
      slug,
      description,
      price: priceInCents,
      burnTimeHours: burnTime,
      waxType,
      scentProfile,
      isActive,
      variants: variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        scent: v.scent,
        waxType: v.waxType,
        colorHex: v.colorHex,
        modelPath: v.modelPath,
        stock: v.stock,
        ...(v._delete ? { _delete: true } : {}),
      })),
    };

    startTransition(async () => {
      let result;
      if (mode === 'create') {
        result = await createProduct(formData);
      } else {
        result = await updateProduct(initialData!.id, formData);
      }

      if ('error' in result) {
        setSubmitError(result.error);
      } else {
        router.push('/admin/products');
      }
    });
  }

  const visibleVariants = variants.filter((v) => !v._delete);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Slug */}
      <div className="space-y-1">
        <label htmlFor="slug" className="block text-sm font-medium text-foreground">
          Slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {errors.slug && <p className="text-xs text-red-400">{errors.slug}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y"
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
      </div>

      {/* Price and Burn Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="price" className="block text-sm font-medium text-foreground">
            Price (Rands)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="burnTimeHours" className="block text-sm font-medium text-foreground">
            Burn Time (hours)
          </label>
          <input
            id="burnTimeHours"
            type="number"
            step="1"
            min="0"
            value={burnTimeHours}
            onChange={(e) => setBurnTimeHours(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          {errors.burnTimeHours && <p className="text-xs text-red-400">{errors.burnTimeHours}</p>}
        </div>
      </div>

      {/* Wax Type and Scent Profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="waxType" className="block text-sm font-medium text-foreground">
            Wax Type
          </label>
          <select
            id="waxType"
            value={waxType}
            onChange={(e) => setWaxType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          >
            <option value="">Select wax type…</option>
            {WAX_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          {errors.waxType && <p className="text-xs text-red-400">{errors.waxType}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="scentProfile" className="block text-sm font-medium text-foreground">
            Scent Profile
          </label>
          <select
            id="scentProfile"
            value={scentProfile}
            onChange={(e) => setScentProfile(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          >
            <option value="">Select scent…</option>
            {SCENT_PROFILE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          {errors.scentProfile && <p className="text-xs text-red-400">{errors.scentProfile}</p>}
        </div>
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center gap-3">
        <label htmlFor="isActive" className="text-sm font-medium text-foreground">
          Active
        </label>
        <button
          id="isActive"
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive(!isActive)}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isActive ? 'bg-theme-accent' : 'bg-border',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              isActive ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Variants</h2>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
          >
            Add Variant
          </button>
        </div>

        {visibleVariants.length === 0 && (
          <p className="text-sm text-muted">No variants added yet.</p>
        )}

        {variants.map((variant, index) => {
          if (variant._delete) return null;
          return (
            <div
              key={variant.id ?? `new-${index}`}
              className="rounded-lg border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">
                  Variant {visibleVariants.indexOf(variant) + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  aria-label={`Remove variant ${visibleVariants.indexOf(variant) + 1}`}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Scent</label>
                  <input
                    type="text"
                    value={variant.scent}
                    onChange={(e) => updateVariant(index, 'scent', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Wax Type</label>
                  <select
                    value={variant.waxType}
                    onChange={(e) => updateVariant(index, 'waxType', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  >
                    {WAX_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Color</label>
                  <input
                    type="color"
                    value={variant.colorHex}
                    onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-surface cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Model Path</label>
                  <input
                    type="text"
                    value={variant.modelPath}
                    onChange={(e) => updateVariant(index, 'modelPath', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium rounded-md bg-theme-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? mode === 'create'
              ? 'Creating…'
              : 'Saving…'
            : mode === 'create'
              ? 'Create Product'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
