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

/**
 * ShippingAddressSummary — Fetches the current user's saved delivery address
 * from /api/profile/address and renders it at checkout.
 * Provides a quick-link to update the address in account settings.
 */
export function ShippingAddressSummary() {
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile/address')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setAddress(data?.address ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--theme-accent)]/10 rounded mb-2" />
        <div className="h-3 w-48 bg-[var(--theme-accent)]/10 rounded" />
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
        <p className="text-sm text-[var(--theme-accent)]/60">
          No delivery address saved.{' '}
          <Link href="/dashboard/settings" className="underline text-[var(--theme-accent)] hover:no-underline">
            Add one now
          </Link>{' '}
          before completing your order.
        </p>
      )}
    </div>
  );
}
