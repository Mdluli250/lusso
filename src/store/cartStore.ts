import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item: Omit<CartItem, 'quantity'>) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            // Increment quantity if item already in cart
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeItem: (variantId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId: string, quantity: number) => {
        if (quantity <= 0) {
          // Remove item if quantity drops to zero or below
          set((state) => ({
            items: state.items.filter((i) => i.variantId !== variantId),
          }));
        } else {
          set((state) => ({
            items: state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            ),
          }));
        }
      },

      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'lusso-cart',
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

/** Selector: total number of items in the cart (reactive) */
export const selectTotalItems = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

/** Selector: total amount in cents (reactive) */
export const selectTotalAmountCents = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
