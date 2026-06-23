import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OnboardingWizard } from './OnboardingWizard';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const me = session?.user as any;
  const client = await prisma.client.findUnique({ where: { ownerId: me.id } });
  if (!client) redirect('/dashboard');
  if (client.briefDone) redirect('/dashboard');
  return <OnboardingWizard businessName={client.businessName} />;
}
