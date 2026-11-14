'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { createSubscription } from '@/actions/subscriptions';
import { updateShippingAddress, type ShippingAddressInput } from '@/actions/profile';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import PayFastCheckoutForm from '@/components/checkout/PayFastCheckoutForm';

interface SubscriptionSelectorProps {
  variantId: string;
  price: number;
}

const FREQUENCIES = [
  { value: 'MONTHLY',    label: 'Monthly',        days: 30 },
  { value: 'BI_MONTHLY', label: 'Every 2 Months', days: 60 },
  { value: 'QUARTERLY',  label: 'Quarterly',      days: 90 },
] as const;

const DISCOUNT_PERCENT = 10;

const EMPTY_ADDRESS: ShippingAddressInput = {
  recipient: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', province: '', postalCode: '', country: 'South Africa',
};

const ADDRESS_FIELDS: { key: keyof ShippingAddressInput; label: string; required?: boolean }[] = [
  { key: 'recipient',    label: 'Full name',               required: true },
  { key: 'phone',        label: 'Phone',                   required: true },
  { key: 'addressLine1', label: 'Address line 1',          required: true },
  { key: 'addressLine2', label: 'Address line 2 (optional)' },
  { key: 'city',         label: 'City / town',             required: true },
  { key: 'province',     label: 'Province',                required: true },
  { key: 'postalCode',   label: 'Postal code',             required: true },
  { key: 'country',      label: 'Country',                 required: true },
];

export function SubscriptionSelector({ variantId, price }: SubscriptionSelectorProps) {
  const { data: session } = useSession();
  const [selectedFrequency, setSelectedFrequency] = useState<string>('MONTHLY');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [payment, setPayment] = useState<{ checkoutId: string; merchantTransactionId: string } | null>(null);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [addressSaving, startAddressTransition] = useTransition();
  const [addressMessage, setAddressMessage] = useState<string | null>(null);

  const discountedPrice = Math.round(price * (1 - DISCOUNT_PERCENT / 100));

  const handleSubscribe = () => {
    if (!session?.user) {
      setMessage({ type: 'error', text: 'Please sign in to subscribe.' });
      return;
    }
    setNeedsAddress(false);
    startTransition(async () => {
      const result = await createSubscription({ variantId, frequency: selectedFrequency });
      if (result.success) {
        if (result.checkoutId && result.merchantTransactionId) {
          setPayment({ checkoutId: result.checkoutId, merchantTransactionId: result.merchantTransactionId });
          setMessage({ type: 'info', text: 'Complete the secure payment below to activate your subscription.' });
        } else {
          setMessage({ type: 'error', text: 'Payment setup was not returned. Please try again.' });
        }
      } else {
        if (result.error.toLowerCase().includes('delivery address')) {
          setNeedsAddress(true);
          setMessage(null);
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      }
    });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressMessage(null);
    startAddressTransition(async () => {
      const result = await updateShippingAddress(addressForm);
      if ('success' in result) {
        setNeedsAddress(false);
        handleSubscribe();
      } else {
        setAddressMessage(result.error);
      }
    });
  };

  if (needsAddress) {
    return (
      <div className="border border-[var(--theme-accent)]/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--theme-accent)]">Add a delivery address to subscribe</h3>
          <button type="button" onClick={() => setNeedsAddress(false)} className="text-xs text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)] underline">
            Cancel
          </button>
        </div>
        <form onSubmit={handleSaveAddress} className="space-y-3">
          {ADDRESS_FIELDS.map(({ key, label, required }) => (
            <div key={key}>
              <label htmlFor={`sub-addr-${key}`} className="block text-xs font-medium text-[var(--theme-accent)]/70 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                id={`sub-addr-${key}`}
                value={addressForm[key]}
                required={required}
                maxLength={180}
                onChange={(e) => setAddressForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
              />
            </div>
          ))}
          {addressMessage && <p className="text-xs text-red-500">{addressMessage}</p>}
          <button type="submit" disabled={addressSaving} className="w-full rounded-lg bg-[var(--theme-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {addressSaving ? 'Saving…' : 'Save address & subscribe'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="border border-[var(--theme-accent)]/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--theme-accent)] uppercase tracking-wide">
          Subscribe &amp; Save {DISCOUNT_PERCENT}%
        </h3>
        <span className="text-xs text-[var(--theme-accent)]/60">{formatZAR(discountedPrice)} per delivery</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq.value}
            type="button"
            onClick={() => setSelectedFrequency(freq.value)}
            className={[
              'px-3 py-2 rounded-lg text-xs font-medium transition-all',
              selectedFrequency === freq.value
                ? 'bg-[var(--theme-accent)] text-white'
                : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]/70 hover:bg-[var(--theme-accent)]/20',
            ].join(' ')}
            aria-pressed={selectedFrequency === freq.value}
          >
            {freq.label}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-[var(--theme-accent)]">{formatZAR(discountedPrice)}</span>
        <span className="text-sm text-[var(--theme-accent)]/50 line-through">{formatZAR(price)}</span>
        <span className="text-xs text-emerald-600 font-medium">Save {DISCOUNT_PERCENT}%</span>
      </div>

      {!payment && (
        <Button variant="primary" size="sm" fullWidth onClick={handleSubscribe} disabled={isPending || !session?.user}>
          {isPending ? 'Subscribing…' : 'Subscribe'}
        </Button>
      )}

      {!session?.user && (
        <p className="text-xs text-[var(--theme-accent)]/50">
          <a href="/auth/signin" className="underline hover:text-[var(--theme-accent)]">Sign in</a>{' '}to subscribe and save.
        </p>
      )}

      {message && (
        <p className={`text-xs ${message.type === 'error' ? 'text-red-400' : 'text-[var(--theme-accent)]/70'}`} role="alert">
          {message.text}
        </p>
      )}

      {payment && (
        <div className="space-y-3">
          <PayFastCheckoutForm uuid={payment.checkoutId} merchantTransactionId={payment.merchantTransactionId} />
          <button type="button" onClick={() => { setPayment(null); setMessage(null); }} className="w-full text-xs text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)] underline transition-colors">
            Cancel and go back
          </button>
        </div>
      )}
    </div>
  );
}
