'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if ('error' in result) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-accent)]">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-[var(--theme-accent)]/80">
              If an account exists for <strong>{email}</strong> you'll receive a reset link within a few minutes. Check your spam folder too.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block mt-2 text-sm text-[var(--theme-accent)] underline hover:no-underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--theme-accent)] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--theme-bg)] px-4 py-2.5 text-sm text-[var(--theme-accent)] placeholder:text-[var(--muted)] focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                placeholder="jane@example.com"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-[var(--theme-accent)] px-6 py-3 text-base font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
            >
              {isPending ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-sm text-[var(--muted)]">
              <Link href="/auth/signin" className="text-[var(--theme-accent)] underline hover:no-underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
