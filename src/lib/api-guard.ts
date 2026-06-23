import { getSafeSession } from '@/lib/session';

/** Returns the session if the caller is an authenticated ADMIN, otherwise null. */
export async function ensureAdmin() {
  const session = await getSafeSession();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

/** Returns the session if the caller is authenticated (any role), otherwise null. */
export async function ensureAuth() {
  const session = await getSafeSession();
  if (!session?.user) return null;
  return session;
}
