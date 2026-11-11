import { create } from 'zustand';

interface GiftWrapStore {
  enabled: boolean;
  message: string;
  toggle: () => void;
  /** Sets the gift message, silently capping at 200 characters. */
  setMessage: (message: string) => void;
  reset: () => void;
}

export const useGiftWrapStore = create<GiftWrapStore>()((set) => ({
  enabled: false,
  message: '',

  toggle: () => {
    set((state) => ({ enabled: !state.enabled }));
  },

  setMessage: (message: string) => {
    set({ message: message.slice(0, 200) });
  },

  reset: () => {
    set({ enabled: false, message: '' });
  },
}));
