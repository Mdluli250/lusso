'use client';

/**
 * EmailPopup — modal overlay for email capture with discount code.
 *
 * Shows after 5s delay for first-time visitors.
 * Stores dismissal timestamp in localStorage, suppresses for 30 days.
 * Does not show for authenticated users.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'lusso-email-popup-dismissed';
const SUPPRESS_DAYS = 30;

export function EmailPopup() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Don't show for authenticated users
    if (session) return;

    // Check if dismissed within the last 30 days
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedAt = new Date(dismissed).getTime();
      const now = Date.now();
      const daysSinceDismissal = (now - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < SUPPRESS_DAYS) return;
    }

    // Show after 5 second delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [session]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscountCode(data.discountCode);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Email signup for discount"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-accent)]/20 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors"
          aria-label="Close popup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {discountCode ? (
          /* Success state */
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--theme-accent)] mb-2">
              Welcome to Lusso! 🎉
            </h2>
            <p className="text-sm text-[var(--theme-accent)]/70 mb-4">
              Here&apos;s your exclusive discount code:
            </p>
            <div className="px-4 py-3 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 mb-4">
              <span className="text-lg font-mono font-bold text-[var(--theme-accent)]">
                {discountCode}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={handleDismiss}>
              Start Shopping
            </Button>
          </div>
        ) : (
          /* Form state */
          <div>
            <h2 className="text-xl font-bold text-[var(--theme-accent)] mb-2">
              Get 10% Off Your First Order
            </h2>
            <p className="text-sm text-[var(--theme-accent)]/70 mb-6">
              Join our community and receive an exclusive discount code.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-bg)] text-[var(--theme-accent)] placeholder:text-[var(--theme-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                aria-label="Email address"
              />

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Get My Discount'}
              </Button>
            </form>

            <p className="text-xs text-[var(--theme-accent)]/40 mt-3 text-center">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
