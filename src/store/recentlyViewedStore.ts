import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface RecentlyViewedEntry {
  productId: string;
  viewedAt: string; // ISO timestamp
}

interface RecentlyViewedStore {
  items: RecentlyViewedEntry[];
  record: (productId: string) => void;
  getDisplayItems: () => RecentlyViewedEntry[];
}

const MAX_ENTRIES = 10;
const DISPLAY_LIMIT = 6;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      record: (productId: string) => {
        set((state) => {
          const now = new Date().toISOString();
          // Remove existing entry for this product if present
          const filtered = state.items.filter(
            (entry) => entry.productId !== productId
          );
          // Add new entry at the front (most recent)
          const updated = [{ productId, viewedAt: now }, ...filtered];
          // Evict oldest entries if exceeding max
          return { items: updated.slice(0, MAX_ENTRIES) };
        });
      },

      getDisplayItems: (): RecentlyViewedEntry[] => {
        return get().items.slice(0, DISPLAY_LIMIT);
      },
    }),
    {
      name: 'lusso-recently-viewed',
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
