import { getSafeSession } from '@/lib/session';
import { isStaff, isAdminLike } from '@/lib/roles';

/** Returns the session if the caller is an authenticated ADMIN, otherwise null. */
export async function ensureAdmin() {
  const session = await getSafeSession();
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

/** Returns the session if the caller is ADMIN or OPS_DIRECTOR, otherwise null. */
export async function ensureAdminLike() {
  const session = await getSafeSession();
  if (!session?.user || !isAdminLike((session.user as any).role)) return null;
  return session;
}

/** Returns the session if the caller is any agency staff role, otherwise null. */
export async function ensureStaff() {
  const session = await getSafeSession();
  if (!session?.user || !isStaff((session.user as any).role)) return null;
  return session;
}

/** Returns the session if the caller is authenticated (any role), otherwise null. */
export async function ensureAuth() {
  const session = await getSafeSession();
  if (!session?.user) return null;
  return session;
}
