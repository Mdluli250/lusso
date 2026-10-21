'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { refundOrder } from '@/actions/admin/orders';

export function RefundForm({ orderId, remainingCents }: { orderId: string; remainingCents: number }) {
  const [amount, setAmount] = useState((remainingCents / 100).toFixed(2));
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Submit refund of R${Number(amount).toFixed(2)} to PayFast?`)) return;
    startTransition(async () => {
      const result = await refundOrder({ orderId, amountZAR: Number(amount), reason });
      if ('error' in result) setMessage(result.error);
      else { setMessage('Refund submitted successfully.'); router.refresh(); }
    });
  }

  return <form onSubmit={submit} className="space-y-3">
    <label className="block text-sm text-muted">Amount (ZAR)<input required type="number" min="0.01" max={(remainingCents / 100).toFixed(2)} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" /></label>
    <label className="block text-sm text-muted">Reason<input required minLength={3} maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" /></label>
    <button disabled={pending || remainingCents <= 0} className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? 'Submitting…' : 'Refund via PayFast'}</button>
    {message && <p role="status" className="text-sm text-muted">{message}</p>}
  </form>;
}
