'use client';

import { useState } from 'react';

interface DocumentDownloadButtonProps {
  orderId: string;
  type: 'invoice' | 'receipt';
  /** Optional extra classes */
  className?: string;
}

const LABELS = {
  invoice: { idle: 'Download Invoice', loading: 'Generating…', icon: '🧾' },
  receipt: { idle: 'Download Receipt', loading: 'Generating…', icon: '✅' },
};

/**
 * DocumentDownloadButton — fetches a PDF from the API route and triggers a
 * browser download without a page navigation. Shows a spinner while the PDF
 * is being generated server-side.
 */
export function DocumentDownloadButton({ orderId, type, className = '' }: DocumentDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const label = LABELS[type];
  const url = `/api/documents/${type === 'invoice' ? 'invoices' : 'receipts'}/${orderId}`;

  async function handleDownload() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Trigger download
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `lusso-${type}-${orderId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={[
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
          'border-[var(--theme-accent)]/20 text-[var(--theme-accent)]',
          'hover:bg-[var(--theme-accent)]/5 active:scale-95',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]',
          className,
        ].join(' ')}
        aria-label={loading ? label.loading : label.idle}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
            />
            {label.loading}
          </>
        ) : (
          <>
            <span aria-hidden="true">{label.icon}</span>
            {label.idle}
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-400 max-w-[200px]">{error}</p>
      )}
    </div>
  );
}
