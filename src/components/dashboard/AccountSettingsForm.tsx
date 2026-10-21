'use client';

import { FormEvent, useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { updateShippingAddress, updateUserName, deleteAccount, type ShippingAddressInput } from '@/actions/profile';
import { Button } from '@/components/ui/Button';

interface AccountSettingsFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  address?: ShippingAddressInput;
}

/**
 * AccountSettingsForm — Client Component with a controlled form for
 * updating the user's display name. Calls the `updateUserName` Server Action
 * and displays the updated name within 500ms.
 *
 * Requirements: 9.4, 9.5
 */
export default function AccountSettingsForm({ user, address }: AccountSettingsFormProps) {
  const [name, setName] = useState(user.name ?? '');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deliveryAddress, setDeliveryAddress] = useState<ShippingAddressInput>(address ?? {
    recipient: user.name ?? '', phone: '', addressLine1: '', addressLine2: '', city: '', province: '', postalCode: '', country: 'South Africa',
  });
  const [addressMessage, setAddressMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateUserName(name);

      if ('success' in result) {
        setMessage({ text: 'Name updated successfully.', type: 'success' });
      } else {
        setMessage({ text: result.error, type: 'error' });
      }
    });
  };

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAddressMessage(null);
    startTransition(async () => {
      const result = await updateShippingAddress(deliveryAddress);
      setAddressMessage('success' in result
        ? { text: 'Delivery address saved.', type: 'success' }
        : { text: result.error, type: 'error' });
    });
  };

  const addressFields: { key: keyof ShippingAddressInput; label: string; required?: boolean }[] = [
    { key: 'recipient', label: 'Recipient', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'addressLine1', label: 'Address line 1', required: true },
    { key: 'addressLine2', label: 'Address line 2' },
    { key: 'city', label: 'City / town', required: true },
    { key: 'province', label: 'Province', required: true },
    { key: 'postalCode', label: 'Postal code', required: true },
    { key: 'country', label: 'Country', required: true },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Account Settings</h2>

      {/* User info display */}
      <div className="flex items-center gap-4">
        {user.image && (
          <img
            src={user.image}
            alt={user.name ?? 'User avatar'}
            className="w-14 h-14 rounded-full border border-surface-muted"
          />
        )}
        <div>
          <p className="text-foreground font-medium">{user.name ?? 'No name set'}</p>
          <p className="text-muted text-sm">{user.email}</p>
        </div>
      </div>

      {/* Name update form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="display-name"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className={[
              'w-full px-4 py-2.5 rounded-lg',
              'bg-surface border border-surface-muted',
              'text-foreground placeholder:text-muted/60',
              'transition-colors duration-150',
              'focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent',
            ].join(' ')}
          />
        </div>

        {message && (
          <p
            role="status"
            className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
          >
            {message.text}
          </p>
        )}

        <Button type="submit" disabled={isPending || name.trim().length === 0}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Delivery Address</h2>
        <p className="text-sm text-muted">Used for deliveries. You can update it before each order.</p>
        <form onSubmit={handleAddressSubmit} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {addressFields.map(({ key, label, required }) => (
            <div key={key} className={key === 'addressLine1' || key === 'addressLine2' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`address-${key}`} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
              <input
                id={`address-${key}`}
                value={deliveryAddress[key]}
                required={required}
                maxLength={180}
                onChange={(event) => setDeliveryAddress((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-lg border border-surface-muted bg-surface px-4 py-2.5 text-foreground focus:border-theme-accent focus:outline-none"
              />
            </div>
          ))}
          {addressMessage && <p role="status" className={`sm:col-span-2 text-sm ${addressMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{addressMessage.text}</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : 'Save Delivery Address'}</Button></div>
        </form>
      </section>

      <DeleteAccountSection />
    </div>
  );
}

/**
 * Separate component so its own state doesn't affect the parent form.
 */
function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if ('error' in result) {
        setMessage(result.error);
        setConfirming(false);
      } else {
        await signOut({ callbackUrl: '/' });
      }
    });
  }

  return (
    <section className="space-y-4 border-t border-red-900/30 pt-8">
      <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
      <p className="text-sm text-muted">
        Permanently delete your account and all associated data. This cannot be undone.
      </p>

      {message && (
        <p role="alert" className="text-sm text-red-400">{message}</p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-700/60 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Delete account
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-red-400 w-full">
            Are you sure? This will permanently delete your account.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            {isPending ? 'Deleting…' : 'Yes, delete my account'}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setMessage(''); }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
