'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateShippingAddress, type ShippingAddressInput } from '@/actions/profile';

interface Address {
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface ShippingAddressSummaryProps {
  /** Called after the user saves a new address from the inline form */
  onAddressAdded?: () => void;
}

const EMPTY_ADDRESS: ShippingAddressInput = {
  recipient: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', province: '', postalCode: '', country: 'South Africa',
};

const ADDRESS_FIELDS: { key: keyof ShippingAddressInput; label: string; required?: boolean; colSpan?: boolean }[] = [
  { key: 'recipient',    label: 'Full name',       required: true },
  { key: 'phone',        label: 'Phone number',    required: true },
  { key: 'addressLine1', label: 'Address line 1',  required: true, colSpan: true },
  { key: 'addressLine2', label: 'Address line 2 (optional)',        colSpan: true },
  { key: 'city',         label: 'City / town',     required: true },
  { key: 'province',     label: 'Province',        required: true },
  { key: 'postalCode',   label: 'Postal code',     required: true },
  { key: 'country',      label: 'Country',         required: true },
];

export function ShippingAddressSummary({ onAddressAdded }: ShippingAddressSummaryProps = {}) {
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setLoading(true);
    setFetchError(false);
    fetch('/api/profile/address')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const addr: Address | null = data?.address ?? null;
        setAddress(addr);
        setLoading(false);
        if (addr) {
          setForm({ ...EMPTY_ADDRESS, ...addr, addressLine2: addr.addressLine2 ?? '' });
          onAddressAdded?.();
        }
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function handleEdit() {
    if (address) {
      setForm({ ...EMPTY_ADDRESS, ...address, addressLine2: address.addressLine2 ?? '' });
    }
    setSaveMessage(null);
    setEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveMessage(null);
    startTransition(async () => {
      const result = await updateShippingAddress(form);
      if ('success' in result) {
        setSaveMessage({ type: 'success', text: 'Address saved.' });
        setEditing(false);
        // Re-fetch to update the display and notify parent
        refresh();
      } else {
        setSaveMessage({ type: 'error', text: result.error });
      }
    });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--theme-accent)]/10 rounded mb-2" />
        <div className="h-3 w-48 bg-[var(--theme-accent)]/10 rounded" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <p className="text-sm text-red-600">
          Could not load your delivery address.{' '}
          <button type="button" onClick={refresh} className="underline hover:no-underline">Try again</button>.
        </p>
      </div>
    );
  }

  // ── Inline form (add or edit) ──────────────────────────────────────────────
  if (editing || !address) {
    return (
      <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--theme-accent)]">
            {address ? 'Edit delivery address' : 'Add a delivery address'}
          </h2>
          {address && (
            <button
              type="button"
              onClick={() => { setEditing(false); setSaveMessage(null); }}
              className="text-xs text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] underline"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ADDRESS_FIELDS.map(({ key, label, required, colSpan }) => (
            <div key={key} className={colSpan ? 'sm:col-span-2' : ''}>
              <label htmlFor={`addr-${key}`} className="block text-xs font-medium text-[var(--theme-accent)]/70 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                id={`addr-${key}`}
                value={form[key]}
                required={required}
                maxLength={180}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-accent)] placeholder:text-[var(--theme-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
              />
            </div>
          ))}

          {saveMessage && (
            <p className={`sm:col-span-2 text-xs ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {saveMessage.text}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[var(--theme-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save address & continue'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Saved address display ──────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--theme-accent)]">Deliver to</h2>
        <button
          type="button"
          onClick={handleEdit}
          className="text-xs text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] underline transition-colors"
        >
          Change
        </button>
      </div>
      <address className="not-italic text-sm text-[var(--theme-accent)]/80 space-y-0.5">
        <p className="font-medium text-[var(--theme-accent)]">{address.recipient}</p>
        <p>{address.phone}</p>
        <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
        <p>{address.city}, {address.province} {address.postalCode}</p>
        <p>{address.country}</p>
      </address>
    </div>
  );
}
