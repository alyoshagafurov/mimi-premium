import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { LandingClient } from './LandingClient';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = (session.user as any).role;
    redirect(role === 'ADMIN' ? '/admin' : '/dashboard');
  }
  return <LandingClient />;
}
