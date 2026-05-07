'use client';

import { FormEvent, useState, useTransition } from 'react';
import { updateUserName } from '@/actions/profile';
import { Button } from '@/components/ui/Button';

interface AccountSettingsFormProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * AccountSettingsForm — Client Component with a controlled form for
 * updating the user's display name. Calls the `updateUserName` Server Action
 * and displays the updated name within 500ms.
 *
 * Requirements: 9.4, 9.5
 */
export default function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [name, setName] = useState(user.name ?? '');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

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
    </div>
  );
}
