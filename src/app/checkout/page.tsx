import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { CheckoutClient } from './CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/checkout?plan=${searchParams.plan ?? 'GROWTH'}`);
  }
  const plan = (searchParams.plan ?? 'GROWTH').toUpperCase();
  return (
    <Suspense>
      <CheckoutClient plan={plan} />
    </Suspense>
  );
}
