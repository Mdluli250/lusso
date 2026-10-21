'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelOrder } from '@/actions/returns';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    setError('');
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if ('error' in result) {
        setError(result.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-700/40 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
      >
        Cancel order
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-red-400">Cancel this order? This cannot be undone.</p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-red-700 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Cancelling…' : 'Yes, cancel'}
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setError(''); }}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Keep order
        </button>
      </div>
    </div>
  );
}
