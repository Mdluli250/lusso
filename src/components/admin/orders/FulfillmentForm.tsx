'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderFulfillment } from '@/actions/admin/orders';

interface Props {
  orderId: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
}

export function FulfillmentForm({ orderId, status, carrier: initialCarrier, trackingNumber: initialTracking }: Props) {
  const [carrier, setCarrier] = useState(initialCarrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? '');
  const [fulfillmentStatus, setFulfillmentStatus] = useState(status);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    setMessage('');
    startTransition(async () => {
      const result = await updateOrderFulfillment({
        orderId,
        fulfillmentStatus: fulfillmentStatus as 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
        carrier,
        trackingNumber,
      });
      if ('error' in result) setMessage(result.error);
      else { setMessage('Fulfillment updated.'); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-muted">Fulfillment status
        <select value={fulfillmentStatus} onChange={(event) => setFulfillmentStatus(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground">
          {['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-muted">Carrier
        <input value={carrier} onChange={(event) => setCarrier(event.target.value)} maxLength={100} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" />
      </label>
      <label className="text-sm text-muted sm:col-span-2">Tracking number
        <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} maxLength={200} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground" />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || status !== 'PAID'} className="rounded-md bg-theme-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save fulfillment'}</button>
        {message && <p role="status" className="text-sm text-muted">{message}</p>}
      </div>
    </div>
  );
}
