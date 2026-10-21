'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestReturn } from '@/actions/returns';

interface Props {
  orderId: string;
  items: { name: string; quantity: number; price?: number }[];
}

export function ReturnRequestForm({ orderId, items }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleItem(i: number) {
    setSelected((s) => ({ ...s, [i]: !s[i] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const returnItems = items
      .map((item, i) => ({ name: item.name, quantity: item.quantity, selected: selected[i] }))
      .filter((item) => item.selected)
      .map(({ name, quantity }) => ({ name, quantity }));

    startTransition(async () => {
      const result = await requestReturn({ orderId, reason, items: returnItems });
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Return request submitted. We\'ll be in touch within 2 business days.' });
        router.refresh();
      }
    });
  }

  if (!expanded) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">
          Need to return something? Read our <Link href="/returns" className="underline hover:no-underline">Returns Policy</Link> first.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--theme-accent)]/20 text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Request a return
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Which items are you returning?</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!selected[i]}
                onChange={() => toggleItem(i)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--theme-accent)]"
              />
              <span className="text-sm text-[var(--theme-accent)]">
                {item.name} × {item.quantity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="return-reason" className="block text-sm font-medium text-foreground mb-1.5">
          Reason for return
        </label>
        <textarea
          id="return-reason"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please describe why you'd like to return these items…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--theme-bg)] px-4 py-2.5 text-sm text-[var(--theme-accent)] placeholder:text-[var(--muted)] focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] resize-none"
        />
        <p className="text-xs text-muted mt-1 text-right">{reason.length}/1000</p>
      </div>

      {message && (
        <p role="alert" className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message.text}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || Object.values(selected).every((v) => !v)}
          className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] text-cream text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Submitting…' : 'Submit return request'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
