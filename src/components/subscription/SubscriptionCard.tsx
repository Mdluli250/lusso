'use client';

import { useState, useTransition } from 'react';
import { updateSubscription, changeSubscriptionFrequency } from '@/actions/subscriptions';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';

interface SubscriptionCardProps {
  subscription: {
    id: string;
    frequency: string;
    status: string;
    nextDeliveryAt: string | null;
    failureReason: string | null;
    createdAt: string;
    variant: {
      id: string;
      scent: string;
      product: {
        name: string;
        slug: string;
        price: number;
        scentProfile: string;
      };
    };
  };
}

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  BI_MONTHLY: 'Every 2 Months',
  QUARTERLY: 'Quarterly',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-amber-500/20 text-amber-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(subscription.status);
  const [currentFrequency, setCurrentFrequency] = useState(subscription.frequency);

  const handleAction = (action: 'pause' | 'resume' | 'cancel') => {
    setError(null);
    startTransition(async () => {
      const result = await updateSubscription(subscription.id, action);
      if (result.success) {
        if (action === 'pause') setCurrentStatus('PAUSED');
        else if (action === 'resume') setCurrentStatus('ACTIVE');
        else if (action === 'cancel') setCurrentStatus('CANCELLED');
      } else {
        setError(result.error);
      }
    });
  };

  const handleFrequencyChange = (newFrequency: string) => {
    setError(null);
    startTransition(async () => {
      const result = await changeSubscriptionFrequency(subscription.id, newFrequency);
      if (result.success) {
        setCurrentFrequency(newFrequency);
      } else {
        setError(result.error);
      }
    });
  };

  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="border border-[var(--theme-accent)]/20 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--theme-accent)]">
            {subscription.variant.product.name}
          </h3>
          <p className="text-sm text-[var(--theme-accent)]/60">
            {subscription.variant.scent} · {FREQUENCY_LABELS[currentFrequency] ?? currentFrequency}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus] ?? ''}`}
        >
          {currentStatus}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[var(--theme-accent)]/50">Price</span>
          <p className="font-medium text-[var(--theme-accent)]">
            {formatZAR(Math.round(subscription.variant.product.price * 0.9))}
          </p>
        </div>
        <div>
          <span className="text-[var(--theme-accent)]/50">Next Delivery</span>
          <p className="font-medium text-[var(--theme-accent)]">
            {subscription.nextDeliveryAt
              ? new Date(subscription.nextDeliveryAt).toLocaleDateString('en-ZA')
              : '—'}
          </p>
        </div>
      </div>

      {/* Failure reason */}
      {subscription.failureReason && currentStatus === 'PAUSED' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">
          Paused due to: {subscription.failureReason}
        </p>
      )}

      {/* Frequency change */}
      {!isCancelled && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--theme-accent)]/60">Frequency:</label>
          <select
            value={currentFrequency}
            onChange={(e) => handleFrequencyChange(e.target.value)}
            disabled={isPending}
            className="text-xs bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 rounded px-2 py-1 text-[var(--theme-accent)]"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="BI_MONTHLY">Every 2 Months</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </div>
      )}

      {/* Actions */}
      {!isCancelled && (
        <div className="flex gap-2 pt-2">
          {currentStatus === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAction('pause')}
              disabled={isPending}
            >
              Pause
            </Button>
          )}
          {currentStatus === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction('resume')}
              disabled={isPending}
            >
              Resume
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('cancel')}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
