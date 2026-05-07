'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Thin client-side wrapper around NextAuth's SessionProvider.
 * Keeps the root layout a Server Component while still providing
 * session context to all client components in the tree.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
