import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';
import { captureError } from '@/lib/monitoring';

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
    // Re-throw Next.js control-flow signals — these are NOT real errors:
    //   • DYNAMIC_SERVER_USAGE — cookies()/headers() bailing out of static render
    //   • NEXT_REDIRECT / NEXT_NOT_FOUND — redirect()/notFound()
    // Swallowing them would break dynamic rendering / navigation.
    const digest = (err as { digest?: string })?.digest;
    if (
      typeof digest === 'string' &&
      (digest === 'DYNAMIC_SERVER_USAGE' ||
        digest.startsWith('NEXT_REDIRECT') ||
        digest.startsWith('NEXT_HTTP_ERROR_FALLBACK') ||
        digest === 'NEXT_NOT_FOUND')
    ) {
      throw err;
    }
    captureError(err, { where: 'getSafeSession' });
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
