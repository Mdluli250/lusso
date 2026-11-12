'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  /** Called after the user saves a new address from the inline prompt */
  onAddressAdded?: () => void;
}

/**
 * ShippingAddressSummary — Fetches the current user's saved delivery address
 * from /api/profile/address and renders it at checkout.
 * Provides a quick-link to update the address in account settings.
 * When no address is saved, shows a prominent "Add address" link.
 */
export function ShippingAddressSummary({ onAddressAdded }: ShippingAddressSummaryProps = {}) {
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  function refresh() {
    setLoading(true);
    setFetchError(false);
    fetch('/api/profile/address')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const addr = data?.address ?? null;
        setAddress(addr);
        setLoading(false);
        // If we just found an address that wasn't there before, notify parent
        if (addr) onAddressAdded?.();
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Could not load your delivery address. Please{' '}
          <button
            type="button"
            onClick={() => refresh()}
            className="underline hover:no-underline"
          >
            try again
          </button>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--theme-accent)]">Deliver to</h2>
        <Link
          href="/dashboard/settings"
          className="text-xs text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] underline transition-colors"
        >
          {address ? 'Change' : 'Add address'}
        </Link>
      </div>

      {address ? (
        <address className="not-italic text-sm text-[var(--theme-accent)]/80 space-y-0.5">
          <p className="font-medium text-[var(--theme-accent)]">{address.recipient}</p>
          <p>{address.phone}</p>
          <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
          <p>{address.city}, {address.province} {address.postalCode}</p>
          <p>{address.country}</p>
        </address>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--theme-accent)]/70">
            You need a delivery address to complete your order.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Add delivery address
          </Link>
        </div>
      )}
    </div>
  );
}
