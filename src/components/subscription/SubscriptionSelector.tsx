'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { createSubscription } from '@/actions/subscriptions';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import PayFastCheckoutForm from '@/components/checkout/PayFastCheckoutForm';

interface SubscriptionSelectorProps {
  variantId: string;
  price: number; // ZAR cents
}

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly', days: 30 },
  { value: 'BI_MONTHLY', label: 'Every 2 Months', days: 60 },
  { value: 'QUARTERLY', label: 'Quarterly', days: 90 },
] as const;

const DISCOUNT_PERCENT = 10;

export function SubscriptionSelector({ variantId, price }: SubscriptionSelectorProps) {
  const { data: session } = useSession();
  const [selectedFrequency, setSelectedFrequency] = useState<string>('MONTHLY');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [payment, setPayment] = useState<{
    checkoutId: string;
    merchantTransactionId: string;
  } | null>(null);

  const discountedPrice = Math.round(price * (1 - DISCOUNT_PERCENT / 100));

  const handleSubscribe = () => {
    if (!session?.user) {
      setMessage({ type: 'error', text: 'Please sign in to subscribe.' });
      return;
    }

    startTransition(async () => {
      const result = await createSubscription({ variantId, frequency: selectedFrequency });

      if (result.success) {
        if (result.checkoutId && result.merchantTransactionId) {
          setPayment({
            checkoutId: result.checkoutId,
            merchantTransactionId: result.merchantTransactionId,
          });
          setMessage({
            type: 'info',
            text: 'Complete the secure payment below to activate your subscription.',
          });
        } else {
          setMessage({ type: 'error', text: 'Payment setup was not returned. Please try again.' });
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  };

  const handleCancelPayment = () => {
    setPayment(null);
    setMessage(null);
  };

  return (
    <div className="border border-[var(--theme-accent)]/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--theme-accent)] uppercase tracking-wide">
          Subscribe &amp; Save {DISCOUNT_PERCENT}%
        </h3>
        <span className="text-xs text-[var(--theme-accent)]/60">
          {formatZAR(discountedPrice)} per delivery
        </span>
      </div>

      {/* Frequency options */}
      <div className="grid grid-cols-3 gap-2">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq.value}
            type="button"
            onClick={() => setSelectedFrequency(freq.value)}
            className={[
              'px-3 py-2 rounded-lg text-xs font-medium transition-all',
              selectedFrequency === freq.value
                ? 'bg-[var(--theme-accent)] text-cream'
                : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]/70 hover:bg-[var(--theme-accent)]/20',
            ].join(' ')}
            aria-pressed={selectedFrequency === freq.value}
          >
            {freq.label}
          </button>
        ))}
      </div>

      {/* Price display */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-[var(--theme-accent)]">
          {formatZAR(discountedPrice)}
        </span>
        <span className="text-sm text-[var(--theme-accent)]/50 line-through">
          {formatZAR(price)}
        </span>
        <span className="text-xs text-emerald-600 font-medium">
          Save {DISCOUNT_PERCENT}%
        </span>
      </div>

      {/* Subscribe button — only shown before payment is initiated */}
      {!payment && (
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={handleSubscribe}
          disabled={isPending || !session?.user}
          aria-label="Subscribe to this product"
        >
          {isPending ? 'Subscribing…' : 'Subscribe'}
        </Button>
      )}

      {/* Sign-in prompt for unauthenticated users */}
      {!session?.user && (
        <p className="text-xs text-[var(--theme-accent)]/50">
          <a href="/auth/signin" className="underline hover:text-[var(--theme-accent)]">
            Sign in
          </a>{' '}
          to subscribe and save.
        </p>
      )}

      {/* Feedback message */}
      {message && (
        <p
          className={`text-xs ${message.type === 'error' ? 'text-red-400' : 'text-[var(--theme-accent)]/70'}`}
          role="alert"
        >
          {message.text}
        </p>
      )}

      {/* PayFast payment form — shown once checkout session is ready */}
      {payment && (
        <div className="space-y-3">
          <PayFastCheckoutForm
            uuid={payment.checkoutId}
            merchantTransactionId={payment.merchantTransactionId}
          />
          <button
            type="button"
            onClick={handleCancelPayment}
            className="w-full text-xs text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)] underline transition-colors"
          >
            Cancel and go back
          </button>
        </div>
      )}
    </div>
  );
}
