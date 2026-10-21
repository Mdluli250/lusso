'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setUserRole } from '@/actions/admin/users';

export function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isAdmin = currentRole === 'ADMIN';

  function toggle() {
    const newRole = isAdmin ? 'CUSTOMER' : 'ADMIN';
    if (!window.confirm(`${isAdmin ? 'Revoke' : 'Grant'} admin access for this user?`)) return;
    startTransition(async () => {
      const result = await setUserRole(userId, newRole);
      if ('error' in result) {
        setMessage(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={[
          'px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50',
          isAdmin
            ? 'border border-red-700/40 text-red-400 hover:bg-red-900/20'
            : 'border border-border text-muted hover:text-foreground hover:bg-surface-muted',
        ].join(' ')}
      >
        {isPending ? '…' : isAdmin ? 'Revoke admin' : 'Make admin'}
      </button>
      {message && <p className="text-xs text-red-400">{message}</p>}
    </div>
  );
}
