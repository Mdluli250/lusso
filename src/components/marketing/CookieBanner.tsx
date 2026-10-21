'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'lusso_cookie_consent';

/**
 * CookieBanner — POPIA/GDPR compliant cookie consent notice.
 * Shown once per browser until the user accepts or declines.
 * Preference is stored in localStorage so it persists across sessions.
 * Only uses strictly necessary cookies; this banner is informational.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (private browsing / SSR) — don't show
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* ignore */ }
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--theme-accent)] leading-relaxed">
              <span className="font-semibold">This site uses cookies</span> for authentication and to remember your preferences. We don&apos;t use advertising or tracking cookies.{' '}
              <Link href="/privacy" className="underline hover:no-underline text-[var(--theme-accent)]">
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={decline}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--theme-accent)]/70 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={accept}
              className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] text-cream text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
