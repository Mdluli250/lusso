import { create } from 'zustand';

interface GiftWrapStore {
  enabled: boolean;
  message: string;
  toggle: () => void;
  setMessage: (message: string) => void;
  reset: () => void;
  isValid: boolean;
}

export const useGiftWrapStore = create<GiftWrapStore>()((set, get) => ({
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

  get isValid() {
    return get().message.length <= 200;
  },
}));
