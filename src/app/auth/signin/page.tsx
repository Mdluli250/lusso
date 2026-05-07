'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-sm">
        {/* Brand heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--theme-accent)]">
            Lusso
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to access your account
          </p>
        </div>

        {/* Google sign-in button */}
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className={[
            'flex w-full items-center justify-center gap-3',
            'rounded-xl border border-white/20 bg-white px-6 py-3',
            'text-base font-medium text-gray-800',
            'transition-colors duration-150',
            'hover:bg-gray-50',
            // WCAG 2.1 AA visible focus indicator (Requirement 11.7)
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
          ].join(' ')}
        >
          {/* Google "G" logo */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-xs text-white/40">
          By signing in you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--theme-accent)]" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
