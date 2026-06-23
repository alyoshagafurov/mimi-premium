import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Returns the session if the caller is an authenticated ADMIN, otherwise null. */
export async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}
