import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { OnboardingWizard } from './OnboardingWizard';

export default async function OnboardingPage() {
  const session = await getSafeSession();
  const me = session?.user as any;
  if (!me?.id) redirect('/auth/login?callbackUrl=/dashboard');
  const client = await prisma.client.findUnique({ where: { ownerId: me.id } });
  if (!client) redirect('/dashboard');
  if (client.briefDone) redirect('/dashboard');
  return <OnboardingWizard businessName={client.businessName} />;
}
