// src/lib/discounts/types.ts

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface DiscountCodeData {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // percentage (1-100) or ZAR cents
  minOrderAmountZAR: number; // in cents, 0 = no minimum
  maxUsageCount: number | null; // null = unlimited
  perUserLimit: number | null; // null = unlimited
  maxDiscountAmountZAR: number | null; // cap for percentage, null = no cap
  stackable: boolean;
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
  applicableProductIds: string[]; // empty = all products
}

export interface CartItemForDiscount {
  productId: string;
  price: number; // ZAR cents
  quantity: number;
}

export interface AppliedDiscount {
  codeId: string; // DiscountCode.id or `emailcapture:${code}`
  code: string;
  type: DiscountType;
  discountAmountZAR: number; // calculated discount in cents
  isEmailCapture: boolean;
}

export interface ValidationSuccess {
  valid: true;
  discount: AppliedDiscount;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationError;
