'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/actions/auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    startTransition(async () => {
      const result = await resetPassword({ token, password });

      if ('error' in result) {
        setMessage({ text: result.error, type: 'error' });
      } else {
        setMessage({ text: 'Password updated. Redirecting to sign in…', type: 'success' });
        setTimeout(() => router.push('/auth/signin'), 2000);
      }
    });
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-400">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-sm text-[var(--theme-accent)] underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--theme-accent)] mb-1.5">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--theme-bg)] px-4 py-2.5 text-sm text-[var(--theme-accent)] placeholder:text-[var(--muted)] focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-[var(--theme-accent)] mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--theme-bg)] px-4 py-2.5 text-sm text-[var(--theme-accent)] placeholder:text-[var(--muted)] focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
          placeholder="Repeat password"
        />
      </div>

      {message && (
        <p role="alert" className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[var(--theme-accent)] px-6 py-3 text-base font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
      >
        {isPending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-accent)]">
            Set new password
          </h1>
        </div>
        <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-t-[var(--theme-accent)] mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
