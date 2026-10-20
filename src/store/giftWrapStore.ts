import { create } from 'zustand';

interface GiftWrapStore {
  enabled: boolean;
  message: string;
  /** True when the message is within the 200-char limit (always true since setMessage enforces the cap). */
  isValid: boolean;
  toggle: () => void;
  /** Sets the gift message, silently capping at 200 characters. */
  setMessage: (message: string) => void;
  reset: () => void;
}

export const useGiftWrapStore = create<GiftWrapStore>()((set) => ({
  enabled: false,
  message: '',
  isValid: true,

  toggle: () => {
    set((state) => ({ enabled: !state.enabled }));
  },

  setMessage: (message: string) => {
    const capped = message.slice(0, 200);
    set({ message: capped, isValid: capped.length <= 200 });
  },

  reset: () => {
    set({ enabled: false, message: '', isValid: true });
  },
}));
