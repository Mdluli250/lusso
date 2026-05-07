'use client';

import { useGiftWrapStore } from '@/store/giftWrapStore';

/**
 * GiftWrapOption — Toggle + message input for gift wrapping at checkout.
 * Adds R49 to the order total when enabled.
 */
export function GiftWrapOption() {
  const enabled = useGiftWrapStore((s) => s.enabled);
  const message = useGiftWrapStore((s) => s.message);
  const toggle = useGiftWrapStore((s) => s.toggle);
  const setMessage = useGiftWrapStore((s) => s.setMessage);
  // Compute isValid from raw state instead of using the getter (which won't trigger re-renders)
  const isValid = message.length <= 200;

  return (
    <div className="border border-[var(--theme-accent)]/20 rounded-xl p-5 space-y-4">
      {/* Toggle */}
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <span className="text-sm font-medium text-[var(--theme-accent)]">
            Add Gift Wrapping
          </span>
          <span className="block text-xs text-[var(--theme-accent)]/60">
            + R49.00
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            enabled ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-accent)]/20',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-[var(--theme-bg)] transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </label>

      {/* Message input — shown when enabled */}
      {enabled && (
        <div className="space-y-2">
          <label
            htmlFor="gift-message"
            className="text-xs font-medium text-[var(--theme-accent)]/70"
          >
            Gift Message (optional)
          </label>
          <textarea
            id="gift-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a personal message..."
            maxLength={200}
            rows={3}
            className={[
              'w-full px-3 py-2 text-sm rounded-lg resize-none',
              'bg-[var(--theme-accent)]/5 border',
              isValid
                ? 'border-[var(--theme-accent)]/20'
                : 'border-red-400',
              'text-[var(--theme-accent)] placeholder:text-[var(--theme-accent)]/30',
              'focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30',
            ].join(' ')}
          />
          <div className="flex justify-end">
            <span
              className={`text-xs ${message.length > 200 ? 'text-red-400' : 'text-[var(--theme-accent)]/50'}`}
            >
              {message.length}/200
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
