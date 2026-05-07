import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // Array of productId strings
  isLoading: boolean;
  toggle: (productId: string) => Promise<void>;
  hydrate: (items: string[]) => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      toggle: async (productId: string) => {
        const { items } = get();
        const isWishlisted = items.includes(productId);

        // Optimistic update
        if (isWishlisted) {
          set({ items: items.filter((id) => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }

        try {
          const { toggleWishlist } = await import('@/actions/wishlist');
          await toggleWishlist(productId);
        } catch {
          // Rollback on error
          set({ items });
        }
      },

      hydrate: (items: string[]) => {
        set({ items });
      },

      has: (productId: string) => {
        return get().items.includes(productId);
      },
    }),
    {
      name: 'lusso-wishlist',
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
