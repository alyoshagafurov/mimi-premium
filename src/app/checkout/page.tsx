import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = { robots: { index: false, follow: false } };

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
