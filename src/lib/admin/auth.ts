/**
 * Shared admin auth helper.
 *
 * NextAuth's default session type doesn't expose `role` — it only appears
 * after the `session` callback in authOptions wires it in. We use a narrow
 * cast to avoid `as any` at every call site.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type SessionWithRole = {
  user: { id: string; role?: string };
} | null;

/**
 * Returns true when the current session belongs to an ADMIN user.
 * Safe to call from Server Actions and Route Handlers.
 */
export async function requireAdminSession(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = (await getServerSession(authOptions)) as SessionWithRole;
  if (!session?.user) return { ok: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') return { ok: false, error: 'Unauthorized' };
  return { ok: true, userId: session.user.id };
}

/**
 * Lightweight boolean check — use when you don't need the userId.
 */
export async function isAdminSession(): Promise<boolean> {
  const result = await requireAdminSession();
  return result.ok;
}
