/**
 * Shared types for product components.
 * Mirrors the Prisma Product + ProductVariant shape for use in Client Components.
 */

export interface ProductVariant {
  id: string;
  productId: string;
  scent: string;
  waxType: string;
  colorHex: string;
  modelPath: string;
  stock: number;
}

export interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // ZAR cents
  burnTimeHours: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}
