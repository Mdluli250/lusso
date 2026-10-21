'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  className?: string;
}

/**
 * ShareButton — uses the Web Share API where available (mobile),
 * falls back to clipboard copy on desktop.
 */
export function ShareButton({ title, text, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
      } catch {
        // User cancelled — do nothing
      }
      return;
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this product"
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
        'border-[var(--theme-accent)]/20 text-[var(--theme-accent)]/70',
        'hover:bg-[var(--theme-accent)]/5 hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)]/40',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]',
        className,
      ].join(' ')}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-400" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
