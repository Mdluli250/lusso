'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateReturnStatus } from '@/actions/returns';

const STATUSES = ['APPROVED', 'REJECTED', 'COMPLETED'] as const;

export function ReturnStatusForm({ returnId, currentStatus }: { returnId: string; currentStatus: string }) {
  const [status, setStatus] = useState<typeof STATUSES[number]>('APPROVED');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (currentStatus === 'COMPLETED' || currentStatus === 'REJECTED') {
    return <p className="text-xs text-muted">This return is in a terminal state.</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    startTransition(async () => {
      const result = await updateReturnStatus({ returnId, status, adminNote: note });
      if ('error' in result) {
        setMessage(result.error);
      } else {
        setMessage('Updated.');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
      <div>
        <label className="block text-xs text-muted mb-1" htmlFor={`status-${returnId}`}>Update status</label>
        <select
          id={`status-${returnId}`}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof STATUSES[number])}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-theme-accent focus:outline-none"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-40">
        <label className="block text-xs text-muted mb-1" htmlFor={`note-${returnId}`}>Admin note (optional)</label>
        <input
          id={`note-${returnId}`}
          type="text"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-theme-accent focus:outline-none"
          placeholder="Visible to you only"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-theme-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {isPending ? 'Saving…' : 'Update'}
      </button>
      {message && <p role="status" className="text-xs text-muted w-full">{message}</p>}
    </form>
  );
}
