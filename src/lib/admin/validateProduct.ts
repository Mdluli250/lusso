interface ProductFormData {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  burnTimeHours?: number;
  waxType?: string;
  scentProfile?: string;
}

/**
 * Validate a product form submission.
 * Returns a map of field names to error messages.
 * An empty object means the form is valid.
 */
export function validateProductForm(data: ProductFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.slug || !data.slug.trim()) {
    errors.slug = 'Slug is required';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Description is required';
  }

  if (data.price == null || data.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  if (data.burnTimeHours == null || data.burnTimeHours <= 0) {
    errors.burnTimeHours = 'Burn time must be greater than 0';
  }

  if (!data.waxType || !data.waxType.trim()) {
    errors.waxType = 'Wax type is required';
  }

  if (!data.scentProfile || !data.scentProfile.trim()) {
    errors.scentProfile = 'Scent profile is required';
  }

  return errors;
}
