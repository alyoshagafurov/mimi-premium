import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/**
 * Defensive wrapper around getServerSession.
 *
 * A stale or undecryptable session cookie (e.g. after NEXTAUTH_SECRET rotation,
 * or a cookie minted by a previous deploy) makes next-auth throw while decoding
 * the JWT. In a Server Component that unhandled throw becomes a full-page
 * "Application error: a server-side exception has occurred" (500).
 *
 * Catching it here turns a hard crash into a graceful "logged out" state: the
 * caller simply treats the visitor as unauthenticated and renders the public
 * page / redirects to login instead of 500-ing.
 */
export async function getSafeSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (err) {
    console.error('[session] failed to read session, treating as anonymous:', err);
    return null;
  }
}

/** Convenience: the typed user object or null. */
export async function getSafeUser() {
  const session = await getSafeSession();
  return (session?.user as
    | { id: string; email?: string | null; name?: string | null; role?: 'ADMIN' | 'CLIENT'; tariff?: string }
    | undefined) ?? null;
}
