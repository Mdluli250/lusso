import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useCartStore } from './cartStore';

export interface BundleItem {
  productId: string;
  variantId: string;
  name: string;
  scent: string;
  price: number; // ZAR cents
  modelPath: string;
}

interface BundleStore {
  items: BundleItem[];
  addItem: (item: BundleItem) => { success: boolean; error?: string };
  removeItem: (productId: string) => void;
  clear: () => void;
  isComplete: boolean;
  totalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  addToCart: () => void;
}

const BUNDLE_SIZE = 3;
const BUNDLE_DISCOUNT_PERCENT = 15;

export function calculateBundleDiscount(items: BundleItem[]): {
  totalPrice: number;
  discountAmount: number;
  discountedPrice: number;
} {
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round(
    (totalPrice * BUNDLE_DISCOUNT_PERCENT) / 100
  );
  const discountedPrice = totalPrice - discountAmount;
  return { totalPrice, discountAmount, discountedPrice };
}

export const useBundleStore = create<BundleStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: BundleItem) => {
        const { items } = get();

        if (items.length >= BUNDLE_SIZE) {
          return { success: false, error: 'Bundle is full' };
        }

        if (items.some((i) => i.productId === item.productId)) {
          return { success: false, error: 'Product already in bundle' };
        }

        set({ items: [...items, item] });
        return { success: true };
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      clear: () => {
        set({ items: [] });
      },

      get isComplete() {
        return get().items.length === BUNDLE_SIZE;
      },

      get totalPrice() {
        return get().items.reduce((sum, item) => sum + item.price, 0);
      },

      get discountedPrice() {
        const { totalPrice, discountAmount } = calculateBundleDiscount(
          get().items
        );
        return totalPrice - discountAmount;
      },

      get discountAmount() {
        return calculateBundleDiscount(get().items).discountAmount;
      },

      addToCart: () => {
        const { items } = get();
        if (items.length !== BUNDLE_SIZE) return;

        const { discountedPrice } = calculateBundleDiscount(items);
        const bundleNames = items.map((i) => i.name).join(' + ');
        const bundleScents = items.map((i) => i.scent).join(', ');

        // Add as a single cart line item with the discounted price
        useCartStore.getState().addItem({
          productId: `bundle-${items.map((i) => i.productId).join('-')}`,
          variantId: `bundle-${items.map((i) => i.variantId).join('-')}`,
          name: `Bundle: ${bundleNames}`,
          scent: bundleScents,
          price: discountedPrice,
          modelPath: items[0].modelPath,
          imageUrl: '',
        });

        // Clear the bundle after adding to cart
        set({ items: [] });
      },
    }),
    {
      name: 'lusso-bundle',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
