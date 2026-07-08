/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AppliedDiscount } from '@/lib/discounts/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock applyPromoCode server action
const mockApplyPromoCode = vi.fn();
vi.mock('@/actions/discounts', () => ({
  applyPromoCode: (...args: unknown[]) => mockApplyPromoCode(...args),
}));

// Mock formatCurrency
vi.mock('@/lib/formatCurrency', () => ({
  formatZAR: (cents: number) => `R ${(cents / 100).toFixed(2)}`,
}));

// Cart store mock state
let mockItems: Array<{
  productId: string;
  price: number;
  quantity: number;
  variantId: string;
  name: string;
  scent: string;
  modelPath: string;
  imageUrl: string;
}> = [];
let mockAppliedDiscounts: AppliedDiscount[] = [];
const mockAddDiscount = vi.fn();
const mockRemoveDiscount = vi.fn();

vi.mock('@/store/cartStore', () => ({
  useCartStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      items: mockItems,
      appliedDiscounts: mockAppliedDiscounts,
      addDiscount: mockAddDiscount,
      removeDiscount: mockRemoveDiscount,
    };
    return selector(state);
  },
}));

// ─── Component import (after mocks) ──────────────────────────────────────────

import { PromoCodeInput } from '../PromoCodeInput';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PromoCodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [
      {
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Test Candle',
        scent: 'Vanilla',
        price: 15000,
        quantity: 2,
        modelPath: '/model.glb',
        imageUrl: '/img.png',
      },
    ];
    mockAppliedDiscounts = [];
  });

  it('renders input field and Apply button', () => {
    render(<PromoCodeInput />);

    expect(screen.getByLabelText('Promo code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });

  it('Apply button is disabled when input is empty', () => {
    render(<PromoCodeInput />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    expect(applyButton).toBeDisabled();
  });

  it('shows loading state ("Applying...") while validating', async () => {
    // Make applyPromoCode hang (never resolve) to observe loading state
    mockApplyPromoCode.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<PromoCodeInput />);

    const input = screen.getByLabelText('Promo code');
    fireEvent.change(input, { target: { value: 'SAVE10' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('Applying...')).toBeInTheDocument();
    });
  });

  it('displays error message in red when validation fails', async () => {
    mockApplyPromoCode.mockResolvedValue({
      valid: false,
      error: 'Invalid promo code.',
    });

    render(<PromoCodeInput />);

    const input = screen.getByLabelText('Promo code');
    fireEvent.change(input, { target: { value: 'BADCODE' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      const errorEl = screen.getByRole('alert');
      expect(errorEl).toHaveTextContent('Invalid promo code.');
      expect(errorEl).toHaveClass('text-red-500');
    });
  });

  it('on success: calls addDiscount, clears input', async () => {
    const discount: AppliedDiscount = {
      codeId: 'code-1',
      code: 'SAVE10',
      type: 'PERCENTAGE',
      discountAmountZAR: 3000,
      isEmailCapture: false,
    };

    mockApplyPromoCode.mockResolvedValue({
      valid: true,
      discount,
    });

    render(<PromoCodeInput />);

    const input = screen.getByLabelText('Promo code');
    fireEvent.change(input, { target: { value: 'SAVE10' } });

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockAddDiscount).toHaveBeenCalledWith(discount);
    });

    // Input should be cleared after successful apply
    expect(input).toHaveValue('');
  });

  it('displays applied code with discount amount and Remove button', () => {
    mockAppliedDiscounts = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
    ];

    render(<PromoCodeInput />);

    expect(screen.getAllByText('SAVE10').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/R 30\.00/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('button', { name: /remove code save10/i })
    ).toBeInTheDocument();
  });

  it('Remove button calls removeDiscount with codeId', () => {
    mockAppliedDiscounts = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
    ];

    render(<PromoCodeInput />);

    const removeButton = screen.getByRole('button', {
      name: /remove code save10/i,
    });
    fireEvent.click(removeButton);

    expect(mockRemoveDiscount).toHaveBeenCalledWith('code-1');
  });

  it('supports multiple applied codes displayed together', () => {
    mockAppliedDiscounts = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
      {
        codeId: 'code-2',
        code: 'EXTRA5',
        type: 'FIXED_AMOUNT',
        discountAmountZAR: 500,
        isEmailCapture: false,
      },
    ];

    render(<PromoCodeInput />);

    expect(screen.getByText('SAVE10')).toBeInTheDocument();
    expect(screen.getByText('EXTRA5')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove code save10/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove code extra5/i })
    ).toBeInTheDocument();
  });
});
