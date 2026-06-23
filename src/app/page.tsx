import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { LandingClient } from './LandingClient';

export default async function Home() {
  const session = await getSafeSession();
  if (session?.user) {
    const role = (session.user as any).role;
    redirect(role === 'ADMIN' ? '/admin' : '/dashboard');
  }
  return <LandingClient />;
}
