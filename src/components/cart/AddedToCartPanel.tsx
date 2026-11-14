'use client';

/**
 * AddedToCartPanel — small overlay panel that appears after adding a product
 * to the cart, offering "Continue Shopping" and "Proceed to Checkout" actions.
 *
 * Usage:
 *   const [showPanel, setShowPanel] = useState(false);
 *   // After addItem():
 *   setShowPanel(true);
 *   // In render:
 *   <AddedToCartPanel productName={name} onClose={() => setShowPanel(false)} />
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddedToCartPanelProps {
  productName: string;
  onClose: () => void;
  /** Auto-dismiss after this many ms. Default 6000. Pass 0 to disable. */
  autoDismissMs?: number;
}

export function AddedToCartPanel({
  productName,
  onClose,
  autoDismissMs = 6000,
}: AddedToCartPanelProps) {
  const router = useRouter();

  // Auto-dismiss
  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]',
        'w-[calc(100%-2rem)] max-w-sm',
        'bg-white border border-[var(--theme-accent)]/15 rounded-2xl shadow-xl',
        'px-5 py-4',
        'flex flex-col gap-3',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0 text-sm">✓</span>
          <div>
            <p className="text-sm font-semibold text-[var(--theme-accent)]">Added to cart</p>
            <p className="text-xs text-[var(--theme-accent)]/60 line-clamp-1">{productName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="text-[var(--theme-accent)]/40 hover:text-[var(--theme-accent)] transition-colors mt-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-[var(--theme-accent)]/20 px-3 py-2 text-xs font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Continue shopping
        </button>
        <button
          type="button"
          onClick={() => router.push('/checkout')}
          className="flex-1 rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
