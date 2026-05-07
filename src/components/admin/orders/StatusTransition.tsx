'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { VALID_TRANSITIONS } from '@/lib/admin/orderTransitions';
import { updateOrderStatus } from '@/actions/admin/orders';
import type { OrderStatus } from '@prisma/client';

interface StatusTransitionProps {
  orderId: string;
  currentStatus: OrderStatus;
}

/**
 * StatusTransition — Client Component for updating order status.
 * Shows a dropdown with only valid next statuses based on the current status.
 * Disabled for terminal states (FAILED, REFUNDED).
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */
export function StatusTransition({ orderId, currentStatus }: StatusTransitionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  const isTerminal = validNextStatuses.length === 0;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatus;
    if (!newStatus) return;

    setMessage(null);

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);

      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `Status updated to ${newStatus}` });
        router.refresh();
      }
    });
  }

  if (isTerminal) {
    return (
      <p className="text-sm text-muted">No transitions available</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <select
          onChange={handleChange}
          defaultValue=""
          disabled={isPending}
          className="px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground transition-colors focus:border-theme-accent disabled:opacity-50"
          aria-label="Update order status"
        >
          <option value="" disabled>
            Select new status…
          </option>
          {validNextStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="text-sm text-muted animate-pulse">Updating…</span>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
