import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { CheckoutClient } from './CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const session = await getSafeSession();
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
