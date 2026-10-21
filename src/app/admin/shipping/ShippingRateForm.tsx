'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveShippingRates } from '@/actions/admin/shipping';

export function ShippingRateForm({ standardRate, freeThreshold }: { standardRate: number; freeThreshold: number }) {
  const [standard, setStandard] = useState((standardRate / 100).toFixed(2));
  const [threshold, setThreshold] = useState((freeThreshold / 100).toFixed(2));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await saveShippingRates({
        standardRateCents: Math.round(parseFloat(standard) * 100),
        freeThresholdCents: Math.round(parseFloat(threshold) * 100),
      });
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Shipping rates saved.' });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-surface p-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="standard-rate">
          Standard shipping rate (ZAR)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">R</span>
          <input
            id="standard-rate"
            type="number"
            min="0"
            step="0.01"
            required
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="w-full pl-7 pr-4 py-2.5 rounded-md border border-border bg-[var(--theme-bg)] text-foreground focus:border-theme-accent focus:outline-none"
          />
        </div>
        <p className="text-xs text-muted mt-1">Charged per order under the free-shipping threshold.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="free-threshold">
          Free shipping threshold (ZAR)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">R</span>
          <input
            id="free-threshold"
            type="number"
            min="0"
            step="0.01"
            required
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full pl-7 pr-4 py-2.5 rounded-md border border-border bg-[var(--theme-bg)] text-foreground focus:border-theme-accent focus:outline-none"
          />
        </div>
        <p className="text-xs text-muted mt-1">Orders at or above this amount ship free.</p>
      </div>

      {message && (
        <p role="status" className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending ? 'Saving…' : 'Save rates'}
      </button>
    </form>
  );
}
