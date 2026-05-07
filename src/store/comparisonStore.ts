import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  waxType: string;
  burnTimeHours: number;
  modelPath: string;
  addedAt: number; // timestamp for ordering
}

interface ComparisonStore {
  slots: [ComparisonProduct | null, ComparisonProduct | null];
  addProduct: (product: ComparisonProduct) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  hasProduct: (productId: string) => boolean;
  filledCount: number;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      slots: [null, null] as [ComparisonProduct | null, ComparisonProduct | null],

      addProduct: (product: ComparisonProduct) => {
        set((state) => {
          const [slot0, slot1] = state.slots;

          // Don't add duplicates
          if (slot0?.id === product.id || slot1?.id === product.id) {
            return state;
          }

          // Fill first empty slot
          if (slot0 === null) {
            return { slots: [product, slot1] as [ComparisonProduct | null, ComparisonProduct | null] };
          }
          if (slot1 === null) {
            return { slots: [slot0, product] as [ComparisonProduct | null, ComparisonProduct | null] };
          }

          // Both full: replace oldest (lowest addedAt)
          if (slot0.addedAt <= slot1.addedAt) {
            return { slots: [product, slot1] as [ComparisonProduct | null, ComparisonProduct | null] };
          } else {
            return { slots: [slot0, product] as [ComparisonProduct | null, ComparisonProduct | null] };
          }
        });
      },

      removeProduct: (productId: string) => {
        set((state) => ({
          slots: [
            state.slots[0]?.id === productId ? null : state.slots[0],
            state.slots[1]?.id === productId ? null : state.slots[1],
          ] as [ComparisonProduct | null, ComparisonProduct | null],
        }));
      },

      clear: () => {
        set({ slots: [null, null] as [ComparisonProduct | null, ComparisonProduct | null] });
      },

      hasProduct: (productId: string) => {
        const { slots } = get();
        return slots[0]?.id === productId || slots[1]?.id === productId;
      },

      get filledCount() {
        const { slots } = get();
        return (slots[0] ? 1 : 0) + (slots[1] ? 1 : 0);
      },
    }),
    {
      name: 'lusso-comparison',
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
