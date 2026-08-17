import { redirect } from 'next/navigation';
import { getSafeSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage() {
  const session = await getSafeSession();
  if (!session?.user) redirect('/auth/login?callbackUrl=/admin/settings');
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user) redirect('/auth/login?callbackUrl=/admin/settings');
  return (
    <SettingsClient
      user={{ id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', avatar: user.avatar ?? null, jobTitle: user.jobTitle ?? '', bio: user.bio ?? '' }}
    />
  );
}
